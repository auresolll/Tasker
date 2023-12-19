import { Categories } from './../schemas/categories.schema';
import { ObjectId } from './../../../shared/mongoose/object-id';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as lodash from 'lodash';
import { isArray, orderBy } from 'lodash';
import moment from 'moment';
import mongoose, { FilterQuery, Model, Types } from 'mongoose';
import { AuthNotRequired } from 'src/features/auth/decorators/auth-not-required.decorator';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { blockFieldUser } from 'src/shared/constants/blockField';
import { ResponsePaginationDto } from 'src/shared/constants/pagination';
import { ENUM_ROLE_TYPE } from 'src/shared/constants/role';
import { ParseObjectIdPipe } from 'src/shared/pipe/parse-object-id.pipe';
import { getFieldIds } from 'src/shared/utils/get-ids';
import { generateSlug } from 'src/shared/utils/random-string';
import { Roles } from 'src/shared/utils/roles.decorator';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { CreateProductDto } from '../dtos/create-product.dto';
import { FetchProductsByUser } from '../dtos/fetch-products-by-user';
import {
  FetchHotProductsDto,
  FetchProductsDto,
} from '../dtos/fetch-products.dto';
import { Product } from '../schemas/product.schema';
import { ProductService } from '../services/product.service';
import { RatingService } from '../services/rating.service';
import { OrderService } from './../../basket/services/order.service';
import { User } from './../../user/schemas/user.schema';
import { CategoriesService } from './../services/categories.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('accessToken')
@Controller('product')
export class ProductController {
  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private ratingService: RatingService,
    private categoriesService: CategoriesService,

    @InjectModel(Product.name) private ProductModel: Model<Product>,
    @InjectModel(Categories.name) private CategoriesModel: Model<Categories>,
  ) {}

  @ApiOperation({
    summary: 'Get tất cả sản phẩm',
  })
  @AuthNotRequired()
  @ApiTags('Public Product')
  @Get('')
  async getProductsWithFilter(
    @Query() query: FetchProductsDto,
  ): Promise<ResponsePaginationDto<Product>> {
    const filter: FilterQuery<Product> = {
      name: { $regex: `${query.name}`, $options: 'i' },
      createdAt: { $lte: query.before },
      deletedAt: null,
    };

    if (!query.name) delete filter.name;
    if (!query.before) delete filter.createdAt;

    const products = await this.productService.getProductsByFilter(
      query.limit,
      query.page,
      query.getSkip(),
      filter,
    );

    const [orders, ratings, categories] = await Promise.all([
      this.orderService.getOrdersByProductsId(getFieldIds(products.result)),
      this.ratingService.getRatingByProductsId(getFieldIds(products.result)),
      this.categoriesService.getCategoriesBySlug(query.categories),
    ]);

    if (query.categories) filter.categories = categories._id;

    return {
      ...products,
      result: await this.productService.filterProductsAndSort(
        products.result,
        ratings,
        query.sort,
      ),
    };
  }

  @ApiOperation({
    summary: 'Get thông tin sản phẩm Hot (Lưu ý: Số lượng bán)',
  })
  @AuthNotRequired()
  @ApiTags('Public Product')
  @Get('hot')
  async getProductsByHot(
    @Query() query: FetchHotProductsDto,
  ): Promise<ResponsePaginationDto<Product>> {
    const filter: FilterQuery<Product> = {
      name: { $regex: `${query.name}`, $options: 'i' },
      createdAt: { $lte: query.before },
      deletedAt: null,
    };

    if (!query.name) delete filter.name;
    if (!query.before) delete filter.createdAt;
    if (!query.categories) delete filter.categories;

    const START_OF_MONTH = moment().startOf('month').format('YYYY-MM-DD hh:mm');
    const END_OF_MONTH = moment().endOf('month').format('YYYY-MM-DD hh:mm');

    const [orders, categories] = await Promise.all([
      this.orderService.getOrdersByDate(START_OF_MONTH, END_OF_MONTH),
      this.categoriesService.getCategoriesBySlug(query.categories),
    ]);

    if (query.categories) filter.categories = categories._id;

    filter._id = {
      $in: getFieldIds(orders, 'product'),
    };

    const products = await this.productService.getProductsByFilter(
      query.limit,
      query.page,
      query.getSkip(),
      filter,
    );

    const ratings = await this.ratingService.getRatingByProductsId(
      getFieldIds(products.result),
    );

    return {
      ...products,
      result: await this.productService.filterProductsAndSort(
        products.result,
        ratings,
        query.sort,
      ),
    };
  }

  @ApiOperation({
    summary: 'Get chi tiết thông tin sản phẩm',
  })
  @AuthNotRequired()
  @ApiTags('Public Product')
  @Get('detail')
  async getDetailProduct(@Query('slug') slug: string) {
    const product = await this.ProductModel.findOne({
      slug: slug,
      deletedAt: null,
    })
      .populate('creator', blockFieldUser)
      .populate('categories');

    const [ratings] = await Promise.all([
      this.ratingService.getRatingByProduct(product),
    ]);

    const numberRating = {
      value: 0,
      count: 0,
    };

    for (let index = 0; index < ratings.length; index++) {
      const rating = ratings[index];
      if (rating) {
        numberRating.count++;
        numberRating.value += rating.star;
      }
    }

    lodash.map(ratings, function (element) {
      if (element) {
        numberRating.count++;
        numberRating.value += element.star;
      }
    });

    numberRating.value = numberRating.value / numberRating.count || 0;

    return {
      ...product.toObject(),
      rating: numberRating,
    };
  }

  @Roles(ENUM_ROLE_TYPE.SELLER)
  @ApiBody({
    type: CreateProductDto,
    isArray: true,
  })
  @ApiOperation({
    summary: 'Post tạo sản phẩm',
  })
  // @AuthNotRequired()
  @Post()
  @ApiTags('Private Product')
  createProduct(@CurrentUser() user: User, @Body() body: CreateProductDto[]) {
    if (!isArray(body)) {
      throw new BadRequestException(
        'Invalid payload, payload phải là có type là array',
      );
    }

    const payload = lodash.map(body, function (element) {
      return lodash.extend({}, element, {
        categories: new Types.ObjectId(element.categories),
        creator: user._id,
        slug: generateSlug(element.name),
      });
    });

    const error = [];

    payload.forEach((item, index) => {
      const position = index + 1;
      if (!mongoose.isValidObjectId(item.categories))
        error.push({
          index: position,
          message: 'Categories phải là 1 ObjectID',
        });

      if (!mongoose.isValidObjectId(item.creator))
        error.push({
          index: position,
          message: 'Creator phải là 1 ObjectID',
        });

      if (item.price < 1000)
        error.push({
          index: position,
          message: 'Giá sản phẩm không thể nhỏ hơn 1000 VND',
        });

      if (item.quantity <= 0)
        error.push({
          index: position,
          message: 'Số lượng sản phẩm không thể < 0',
        });

      if (item.pictures.length <= 0) {
        error.push({
          index: position,
          message: 'Sản phẩm phải có ảnh',
        });
      }
    });

    if (error.length > 0) {
      throw new BadRequestException({
        code: 'CREATE_PRODUCT_501',
        message: 'Thông tin gửi lên không chính xác',
        data: orderBy(error, 'index', 'asc'),
      });
    }

    return this.productService.create(payload as unknown as Partial<Product>[]);
  }

  @Roles(ENUM_ROLE_TYPE.SELLER)
  @ApiOperation({
    summary: 'Put sửa sản phẩm',
  })
  @Put()
  @ApiTags('Private Product')
  updateProduct(
    @Query('id', new ParseObjectIdPipe()) id: string,
    @Body() body: CreateProductDto,
  ) {
    return this.ProductModel.findByIdAndUpdate({ _id: id }, body);
  }

  @Roles(ENUM_ROLE_TYPE.SELLER)
  @ApiOperation({
    summary: 'Delete sửa sản phẩm',
  })
  @Delete()
  @ApiTags('Private Product')
  deleteProduct(@Query('id', new ParseObjectIdPipe()) id: string) {
    return this.ProductModel.findByIdAndUpdate(
      { _id: id },
      { deletedAt: new Date() },
    );
  }

  @ApiOperation({
    summary: 'Get tất cả sảm phẩm của (người bán)',
  })
  @ApiTags('Private Product')
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Get('products-by-user')
  async getProductsByUser(
    @CurrentUser() user: User,
    @Query() query: FetchProductsByUser,
  ): Promise<ResponsePaginationDto<Product>> {
    const filter: FilterQuery<Product> = {
      creator: user._id,
      name: RegExp(query.name || '', 'i'),
      categories: new Types.ObjectId(query.categoriesID),
      deletedAt: null,
    };

    if (!query.name) delete filter.name;
    if (!query.categoriesID) delete filter.categories;

    console.log(filter);

    const products = await this.ProductModel.find(filter)
      .sort({ createdAt: query.timeSort === 'ASC' ? 'asc' : 'desc' })
      .limit(query.limit)
      .skip(query.getSkip());

    const count = await this.ProductModel.count(filter);
    return {
      currentPage: query.page,
      limit: query.limit,
      result: products,
      totalItem: products.length,
      totalPage: Math.ceil(count / query.limit),
    };
  }

  @ApiTags('Private Product')
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @ApiOperation({
    summary: 'Get tất cả sản phẩm đã hủy',
  })
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Get('products-cancel')
  async getProductsCancel(
    @CurrentUser() user: User,
    @Query() query: FetchProductsByUser,
  ): Promise<ResponsePaginationDto<Product>> {
    const filter: FilterQuery<Product> = {
      creator: user._id,
      name: RegExp(query.name, 'i'),
      deletedAt: { $ne: null },
    };

    if (!query.name) delete filter.name;

    const products = await this.ProductModel.find(filter)
      .sort({ createdAt: query.timeSort === 'ASC' ? 'asc' : 'desc' })
      .limit(query.limit)
      .skip(query.getSkip());

    const count = await this.ProductModel.count(filter);
    return {
      currentPage: query.page,
      limit: query.limit,
      result: products,
      totalItem: products.length,
      totalPage: Math.ceil(count / query.limit),
    };
  }

  // @AuthNotRequired()
  // @ApiTags('Public Product')
  // @Get('updateSlug')
  // async updateSlug() {
  //   const categories = await this.CategoriesModel.find();
  //   const products = await this.ProductModel.find();

  //   const promise = [];
  //   let index = 0;
  //   products.forEach((dataset) => {
  //     dataset.categories = categories[index]._id;
  //     promise.push(Promise.resolve(dataset.save()));
  //     index++;
  //     if (index === categories.length) index = 0;
  //   });

  //   return Promise.all(promise);
  // }
}
