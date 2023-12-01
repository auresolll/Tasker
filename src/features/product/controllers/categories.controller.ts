import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { AuthNotRequired } from 'src/features/auth/decorators/auth-not-required.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { OrderService } from 'src/features/basket/services/order.service';
import { ENUM_ROLE_TYPE } from 'src/shared/constants/role';
import { ParseObjectIdPipe } from 'src/shared/pipe/parse-object-id.pipe';
import { generateSlug } from 'src/shared/utils/random-string';
import { Roles } from 'src/shared/utils/roles.decorator';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { Categories } from '../schemas/categories.schema';
import { CategoriesService } from '../services/categories.service';
import { ProductService } from '../services/product.service';
import { Order } from './../../basket/schemas/order.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('accessToken')
@Controller('categories')
export class CategoriesController {
  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private categoriesService: CategoriesService,

    @InjectModel(Categories.name) private categoriesModel: Model<Categories>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  @ApiOperation({
    summary: 'Get thông tin tất cả loại sảm phẩm',
  })
  @AuthNotRequired()
  @ApiTags('Public Categories')
  @Get('')
  getCategories() {
    return this.categoriesModel.find();
  }

  @ApiOperation({
    summary: 'Get thông tin tất cả loại sảm phẩm',
  })
  @AuthNotRequired()
  @ApiTags('Public Categories')
  @Get('populate')
  async getPopulateCategories() {
    const [orders, categories] = await Promise.all([
      this.orderModel.find().populate('product'),
      this.categoriesModel.find(),
    ]);

    return this.categoriesService.getPopulateCategories(orders, categories);
  }

  @ApiOperation({
    summary: 'Get thông tin tất cả loại sảm phẩm',
  })
  @AuthNotRequired()
  @ApiTags('Public Categories')
  @Get('with-products')
  getCategoriesWithProducts() {
    return this.categoriesService.getCategoriesWithProducts();
  }

  @ApiOperation({
    summary: 'Delete loại sảm phẩm (Administration)',
  })
  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @ApiTags('Private Categories')
  @Delete('')
  deleteCategories(@Query('categoriesID', new ParseObjectIdPipe()) id: string) {
    return this.categoriesModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
    });
  }

  @ApiOperation({
    summary: 'Update loại sảm phẩm (Administration)',
  })
  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @ApiTags('Private Categories')
  @Patch('')
  updateCategories(
    @Query('categoriesID', new ParseObjectIdPipe()) id: string,
    @Query('name') name: string,
    @Query('description') description: string,
  ) {
    return this.categoriesModel.findByIdAndUpdate(id, {
      name,
      description,
      slug: generateSlug(name),
    });
  }

  @ApiOperation({
    summary: 'Create loại sảm phẩm (Administration)',
  })
  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @ApiTags('Private Categories')
  @Post('')
  createCategories(
    @Query('name') name: string,
    @Query('description') description: string,
  ) {
    const payload: Partial<Categories> = {
      name,
      description,
      slug: generateSlug(name),
    };
    return this.categoriesModel.create(payload);
  }
}
