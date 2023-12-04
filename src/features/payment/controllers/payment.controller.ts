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
import { FilterQuery, Model } from 'mongoose';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { User } from 'src/features/user/schemas/user.schema';
import { RecoverService } from 'src/features/user/services/recover.service';
import { ENUM_ROLE_TYPE, getAllRoles } from 'src/shared/constants/role';
import { ParseObjectIdPipe } from 'src/shared/pipe/parse-object-id.pipe';
import { Roles } from 'src/shared/utils/roles.decorator';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { CreateTransactionTransferMoneyDto } from '../dtos/create-transaction';
import { FetchTransaction } from '../dtos/fetch-transaction';
import {
  ENUM_TRANSACTION_STATUS,
  ENUM_TRANSACTION_TYPE,
  Transaction,
} from '../schemas/transaction.schema';
import { PaymentService } from '../services/payment.service';
import { AuthNotRequired } from 'src/features/auth/decorators/auth-not-required.decorator';
import { random } from 'lodash';
import * as moment from 'moment';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('accessToken')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly recoverService: RecoverService,
    private readonly mailerService: MailerService,

    @InjectModel(Transaction.name) private TransactionModel: Model<Transaction>,
    @InjectModel(User.name) private UserModel: Model<User>,
  ) {}

  @AuthNotRequired()
  @ApiTags('Private Payment')
  @Get('/initiate-payment')
  initiatePayment(@Res() res: any, @Req() req: any): void {
    let vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = 'http://localhost:5555/payment/return';
    const IP =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const vnp_HashSecret: string = 'NFDCLZENBIXDCHBWGNCCITSSTUUUSWKF';
    let params: any = {
      vnp_Version: '2.1.0',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_Command: 'pay',
      vnp_TmnCode: 'WWOFAI0K',
      vnp_Amount: 100000 * 100,
      vnp_CurrCode: 'VND',
      vnp_OrderInfo: 'Thanh toán đơn hàng',
      vnp_CreateDate: 20231204153855,
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: random(10000, 99999),
    };

    params = this.paymentService.sortObject(params);

    let querystring = require('qs');
    let signData = querystring.stringify(params, { encode: false });
    let crypto = require('crypto');
    let hmac = crypto.createHmac('sha512', vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(params, { encode: false });

    res.redirect(vnpUrl);
  }

  @ApiTags('Private Payment')
  @AuthNotRequired()
  @Get('/return')
  handleReturn(@Req() req: any): any {
    const queryParams = req.query;

    return { message: 'Thanh toán thành công', queryParams };
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
    summary: 'Tạo giao dịch chuyển tiền',
  })
  @ApiTags('Private Transaction')
  @Roles(...getAllRoles())
  @Post('transfer-system')
  async createTransactionTransferMoney(
    @CurrentUser() user: User,
    @Body() body: CreateTransactionTransferMoneyDto,
  ) {
    const [user_receiver, user_depositor] = await Promise.all([
      this.UserModel.findById(body.receiver),
      this.UserModel.findById(body.depositor),
    ]);

    if (!user_receiver || !user_depositor)
      throw new NotFoundException(
        `Không tìm thấy ${user_receiver ? 'Người nhận' : 'Người gửi'}`,
      );

    if (body.amount < 10000)
      throw new BadRequestException(
        'Số tiền giao dịch không thể nhỏ hơn 10.000 VND',
      );

    if (user.balance - body.amount <= 0)
      throw new BadRequestException('Số tiền trong tài khoản không đủ');

    const payload: Partial<Transaction> = {
      receiver: user_receiver._id,
      depositor: user_depositor._id,
      amount: body.amount,
      description: ENUM_TRANSACTION_TYPE.TRANSFER_MONEY,
      status: ENUM_TRANSACTION_STATUS.PEENING,
      accountBank: 'system',
    };

    const isSuccessCreated = await this.TransactionModel.create(payload);

    if (!isSuccessCreated)
      throw new BadRequestException('Tạo giao dịch không thành công');

    user_receiver.balance += body.amount;
    user_depositor.balance -= body.amount;

    isSuccessCreated.status = ENUM_TRANSACTION_STATUS.SUCCEED;

    const [isTransactionSucceed, receiverSucceed, depositorSucceed] =
      await Promise.all([
        isSuccessCreated.save(),
        user_receiver.save(),
        user_depositor.save(),
      ]);

    return {
      transaction: isTransactionSucceed,
      receiver: receiverSucceed,
      depositor: depositorSucceed,
      message: 'Chuyển tiền thành công',
    };
  }

  @ApiTags('Private Transaction')
  @Roles(...getAllRoles())
  @Post('recharge')
  async createRecharge(
    @CurrentUser() user: User,
    @Query('amount') amount: number,
    @Query('accountBank') accountBank: string,
  ) {
    const administrator = await this.UserModel.findById(
      '6544c8129d85a36c1ddbc67f',
    );

    if (!administrator)
      throw new NotFoundException('Không tìm thấy tài khoản #Administrator');

    const payloadCustomer: Partial<Transaction> = {
      receiver: administrator._id,
      depositor: user._id,
      description: ENUM_TRANSACTION_TYPE.RECHARGE,
      status: ENUM_TRANSACTION_STATUS.SUCCEED,
      amount: amount,
      accountBank: accountBank,
    };

    const isSuccessCreated = await this.TransactionModel.create(
      payloadCustomer,
    );

    if (!isSuccessCreated)
      throw new BadRequestException('Lỗi khi tạo giao dịch');

    administrator.balance += amount;
    user.balance += amount;

    const [administratorSucceed, userSucceed] = await Promise.all([
      administrator.save(),
      user.save(),
    ]);

    return {
      administrator: administratorSucceed,
      user: userSucceed,
      transaction: isSuccessCreated,
      message: 'Nạp tiền thành công',
    };
  }

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

    if (user.bank)
      throw new BadRequestException(
        'Bạn phải cập nhập tài khoản ngân hàng để rút tiền',
      );

    if (user.balance - amount <= 0)
      throw new BadRequestException('Số tiền trong tài khoản không đủ');

    const payload: Partial<Transaction> = {
      receiver: user._id,
      depositor: administrator._id,
      description: ENUM_TRANSACTION_TYPE.WITHDRAWAL,
      status: ENUM_TRANSACTION_STATUS.PEENING,
      amount: amount,
      accountBank: user.bank,
    };

    const isSuccessCreated = await this.TransactionModel.create(payload);

    if (!isSuccessCreated)
      throw new BadRequestException('Lỗi khi tạo giao dịch');

    user.balance -= amount;

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

  @ApiTags('Private Transaction')
  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @Patch('withdrawal')
  async updateStatusWithdrawalTransaction(
    @Query('transactionID', new ParseObjectIdPipe()) id: string,
    @Query('receiverID', new ParseObjectIdPipe()) user: string,
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
      throw new NotFoundException(
        `Không tìm thấy tài khoản #Administrator: ${administrator}`,
      );

    transaction.status = ENUM_TRANSACTION_STATUS.SUCCEED;
    administrator.balance -= transaction.amount;

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
      message: 'Rút tiền thành công',
    };
  }
}
