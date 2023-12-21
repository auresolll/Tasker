import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilterQuery, Model, Types } from 'mongoose';
import { AuthNotRequired } from 'src/features/auth/decorators/auth-not-required.decorator';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { Order } from 'src/features/basket/schemas/order.schema';
import { User } from 'src/features/user/schemas/user.schema';
import { RecoverService } from 'src/features/user/services/recover.service';
import { ENUM_ROLE_TYPE, getAllRoles } from 'src/shared/constants/role';
import { ParseObjectIdPipe } from 'src/shared/pipe/parse-object-id.pipe';
import { Roles } from 'src/shared/utils/roles.decorator';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { CreateTransactionTransferMoneyDto } from '../dtos/create-transaction';
import { FetchTransaction } from '../dtos/fetch-transaction';
import {
  InitiatePaymentDto,
  InitiatePaymentOrderDto,
} from '../dtos/initiate-payment';
import {
  ENUM_TRANSACTION_STATUS,
  ENUM_TRANSACTION_TYPE,
  Transaction,
} from '../schemas/transaction.schema';
import { PaymentService } from '../services/payment.service';
import { UpdateTransactionDto } from '../dtos/update-status-transaction';
import { PaymentAnalysisService } from '../services/payment-analysis.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('accessToken')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paymentAnalysisService: PaymentAnalysisService,
    private readonly recoverService: RecoverService,
    private readonly mailerService: MailerService,

    @InjectModel(Transaction.name) private TransactionModel: Model<Transaction>,
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Order.name) private OrderModel: Model<Order>,
  ) {}

  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @ApiTags('Private Payment')
  @Get('statistical-overview')
  async statisticalOverview(
    @Query('start_date') start_date: Date,
    @Query('end_date') end_date: Date,
  ) {
    try {
      return this.paymentAnalysisService.statisticalOverview(
        new Date(start_date),
        new Date(end_date),
      );
    } catch (error) {
      throw new BadRequestException('Invalid Date');
    }
  }

  @Roles(ENUM_ROLE_TYPE.SELLER)
  @ApiTags('Private Payment')
  @Get('statistical-overview-by-user')
  async statisticalOverviewByUser(
    @CurrentUser() user: User,
    @Query('start_date') start_date: Date,
    @Query('end_date') end_date: Date,
  ) {
    try {
      return this.paymentAnalysisService.statisticalOverviewByUser(
        user,
        new Date(start_date),
        new Date(end_date),
      );
    } catch (error) {
      throw new BadRequestException('Invalid Date');
    }
  }

  @AuthNotRequired()
  @ApiTags('Private Payment')
  @Get('initiate-payment-order')
  async orderPayment(
    @Res() res: any,
    @Req() req: any,
    @Query() query: InitiatePaymentOrderDto,
  ): Promise<void> {
    const returnUrl = 'https://marketmmo.vercel.app/payment/callback';

    const ipAddress =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const orderInfo = String(`ORDER_ID: ${query.orderID}`);

    res.redirect(
      await this.paymentService.generatePaymentUrl(
        ipAddress,
        query.amount,
        orderInfo,
        returnUrl,
      ),
    );
  }

  @AuthNotRequired()
  @ApiTags('Private Payment')
  @Get('callback')
  async callbackReturn(@Req() req: any, @Res() res: any) {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = this.paymentService.sortObject(vnp_Params);
    let secretKey: string = 'NFDCLZENBIXDCHBWGNCCITSSTUUUSWKF';
    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require('crypto');
    let hmac = crypto.createHmac('sha512', secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
    }

    let rspCode = vnp_Params['vnp_ResponseCode'];

    res.status(200).json({ RspCode: '00', Message: 'success' });
  }

  @ApiOperation({
    summary: 'Get lịch sử giao dịch (Người bán)',
  })
  @ApiTags('Private Transaction')
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Get('by-user')
  async getTransactionsByUser(
    @CurrentUser() user: User,
    @Query() query: FetchTransaction,
  ) {
    const filter: FilterQuery<Transaction> = {
      ...this.paymentService.getDirectTransactionMySelfFilter(user),
      description: query.type,
    };

    if (!query.type) delete filter.description;

    const [transactions, count] = await this.paymentService.getTransactions(
      filter,
      query.limit,
      query.getSkip(),
    );

    return {
      currentPage: query.page,
      limit: query.limit,
      result: transactions,
      totalItem: count,
      totalPage: Math.ceil(count / query.limit),
    };
  }

  @ApiOperation({
    summary: 'Get lịch sử giao dịch (Admin)',
  })
  @ApiTags('Private Transaction')
  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @Get('')
  async getTransactions(@Query() query: FetchTransaction) {
    const filter: FilterQuery<Transaction> = {
      description: query.type,
    };

    if (query.userID) filter.receiver = new Types.ObjectId(query.userID);

    if (!query.type) delete filter.description;

    const [transactions, count] = await this.paymentService.getTransactions(
      filter,
      query.limit,
      query.getSkip(),
    );

    return {
      currentPage: query.page,
      limit: query.limit,
      result: transactions,
      totalItem: count,
      totalPage: Math.ceil(count / query.limit),
    };
  }

  // @ApiOperation({
  //   summary: 'Tạo giao dịch chuyển tiền',
  // })
  // @ApiTags('Private Transaction')
  // @Roles(...getAllRoles())
  // @Post('transfer-system')
  // async createTransactionTransferMoney(
  //   @CurrentUser() user: User,
  //   @Body() body: CreateTransactionTransferMoneyDto,
  // ) {
  //   const [user_receiver, user_depositor] = await Promise.all([
  //     this.UserModel.findById(body.receiver),
  //     this.UserModel.findById(body.depositor),
  //   ]);

  //   if (!user_receiver || !user_depositor)
  //     throw new NotFoundException(
  //       `Không tìm thấy ${user_receiver ? 'Người nhận' : 'Người gửi'}`,
  //     );

  //   if (body.amount < 10000)
  //     throw new BadRequestException(
  //       'Số tiền giao dịch không thể nhỏ hơn 10.000 VND',
  //     );

  //   if (user.balance - body.amount <= 0)
  //     throw new BadRequestException('Số tiền trong tài khoản không đủ');

  //   const payload: Partial<Transaction> = {
  //     receiver: user_receiver._id,
  //     depositor: user_depositor._id,
  //     amount: body.amount,
  //     description: ENUM_TRANSACTION_TYPE.TRANSFER_MONEY,
  //     status: ENUM_TRANSACTION_STATUS.PEENING,
  //   };

  //   const isSuccessCreated = await this.TransactionModel.create(payload);

  //   if (!isSuccessCreated)
  //     throw new BadRequestException('Tạo giao dịch không thành công');

  //   user_receiver.balance += body.amount;
  //   user_depositor.balance -= body.amount;

  //   isSuccessCreated.status = ENUM_TRANSACTION_STATUS.SUCCEED;

  //   const [isTransactionSucceed, receiverSucceed, depositorSucceed] =
  //     await Promise.all([
  //       isSuccessCreated.save(),
  //       user_receiver.save(),
  //       user_depositor.save(),
  //     ]);

  //   return {
  //     transaction: isTransactionSucceed,
  //     receiver: receiverSucceed,
  //     depositor: depositorSucceed,
  //     message: 'Chuyển tiền thành công',
  //   };
  // }

  @ApiOperation({ summary: 'Tạo 1 giao dịch rút tiền' })
  @ApiTags('Private Transaction')
  @Roles(...getAllRoles())
  @Post('withdrawal')
  async createWithdrawal(
    @CurrentUser() user: User,
    @Query('amount') amount: number,
  ) {
    const administrator = await this.UserModel.findById(
      '6544c8129d85a36c1ddbc67f',
    );

    if (!administrator)
      throw new NotFoundException('Không tìm thấy tài khoản #Administrator');

    if (user.balance - amount <= 0)
      throw new BadRequestException('Số tiền trong tài khoản không đủ');

    const payload: Partial<Transaction> = {
      receiver: user._id,
      depositor: administrator._id,
      description: ENUM_TRANSACTION_TYPE.WITHDRAWAL,
      status: ENUM_TRANSACTION_STATUS.PEENING,
      amount: amount,
    };

    const isSuccessCreated = await this.TransactionModel.create(payload);

    if (!isSuccessCreated)
      throw new BadRequestException('Lỗi khi tạo giao dịch');

    user.balance -= amount;
    administrator.balance -= amount;

    const [administratorSucceed, userSucceed] = await Promise.all([
      administrator.save(),
      user.save(),
    ]);

    return {
      administrator: administratorSucceed,
      user: userSucceed,
      transaction: isSuccessCreated,
      message: 'Rút tiền thành công, đang chờ xử lý',
    };
  }

  @ApiOperation({ summary: 'Thay đổi trạng thái rút tiền' })
  @ApiTags('Private Transaction')
  // @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @AuthNotRequired()
  @Patch('withdrawal')
  async updateStatusWithdrawalTransaction(
    @Query('transactionID', new ParseObjectIdPipe()) id: string,
    @Query('receiverID', new ParseObjectIdPipe()) user: string,
    @Query() query: UpdateTransactionDto,
  ) {
    const [transaction, receiver, administrator] = await Promise.all([
      this.TransactionModel.findById(id),
      this.UserModel.findById(user),
      this.UserModel.findById('6544c8129d85a36c1ddbc67f'),
    ]);

    if (transaction.description !== ENUM_TRANSACTION_TYPE.WITHDRAWAL)
      throw new NotFoundException(`API này chỉ dành cho rút tiền`);

    if (!transaction)
      throw new NotFoundException(`Không tìm thấy #transaction: ${id}`);

    if (!receiver)
      throw new NotFoundException(`Không tìm thấy #receiver: ${user}`);

    if (!administrator)
      throw new NotFoundException(`Không tìm thấy tài khoản #Administrator`);

    transaction.status = query.transaction_type;

    const [transactionSucceed, receiverSucceed, administratorSucceed] =
      await Promise.all([
        transaction.save(),
        receiver.save(),
        administrator.save(),
      ]);

    return {
      transaction: transactionSucceed,
      receiver: receiverSucceed,
      administrator: administratorSucceed,
      message:
        query.transaction_type === ENUM_TRANSACTION_STATUS.PEENING
          ? "'Rút tiền đang chờ xử lý'"
          : 'Rút tiền thành công',
    };
  }
}
