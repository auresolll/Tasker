import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilterQuery, Model } from 'mongoose';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { User } from 'src/features/user/schemas/user.schema';
import { ENUM_ROLE_TYPE, getAllRoles } from 'src/shared/constants/role';
import { Roles } from 'src/shared/utils/roles.decorator';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { CreateTransactionDto } from '../dtos/create-transaction';
import { FetchTransaction } from '../dtos/fetch-transaction';
import {
  ENUM_TRANSACTION_STATUS,
  ENUM_TRANSACTION_TYPE,
  Transaction,
} from '../schemas/transaction.schema';
import { TransactionService } from '../services/transaction.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('accessToken')
@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,

    @InjectModel(Transaction.name) private TransactionModel: Model<Transaction>,
    @InjectModel(User.name) private UserModel: Model<User>,
  ) {}

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
      ...this.transactionService.getDirectTransactionMySelfFilter(user),
      description: query.type,
    };

    if (!query.type) delete filter.description;

    const [transactions, count] = await this.transactionService.getTransactions(
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

    const [transactions, count] = await this.transactionService.getTransactions(
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
  @Post('transfer-money')
  async createTransactionTransferMoney(@Body() body: CreateTransactionDto) {
    const [user_receiver, user_depositor] = await Promise.all([
      this.UserModel.findById(body.receiver),
      this.UserModel.findById(body.depositor),
    ]);

    if (!user_receiver || !user_depositor)
      throw new NotFoundException(
        `Không tìm thấy ${user_receiver ? 'Người nhận' : 'Người gửi'}`,
      );
    if (body.amount < 1000)
      throw new BadRequestException('Số tiền giao dịch không thể nhỏ hơn 1000');

    const payload: Partial<Transaction> = {
      receiver: user_receiver._id,
      depositor: user_depositor._id,
      amount: body.amount,
      description: ENUM_TRANSACTION_TYPE.TRANSFER_MONEY,
      status: ENUM_TRANSACTION_STATUS.PEENING,
      accountNumber: body.accountNumber,
    };

    const isSuccessCreated = await this.TransactionModel.create(payload);

    if (!isSuccessCreated)
      throw new BadRequestException('Tạo giao dịch không thành công');

    user_receiver.balance += body.amount;
    user_depositor.balance -= body.amount;

    isSuccessCreated.status = ENUM_TRANSACTION_STATUS.SUCCEED;
    const [isSucceed, receiver, depositor] = await Promise.all([
      isSuccessCreated.save(),
      user_receiver.save(),
      user_depositor.save(),
    ]);

    return {
      isSucceed,
      receiver,
      depositor,
    };
  }

  @ApiOperation({
    summary: 'Tạo giao dịch nạp tiền or rút tiền',
  })
  @ApiTags('Private Transaction')
  @Roles(...getAllRoles())
  @Post('')
  async createTransaction(
    @CurrentUser() user: User,
    @Query('transfer_type') transfer_type: ENUM_TRANSACTION_TYPE,
    @Query('amount') amount: number,
    @Query('account_number') account_number: string,
  ) {
    const payload: Partial<Transaction> = {
      receiver: user._id,
      depositor: user._id, // ID Of ADMIN
      description: transfer_type,
      amount: amount,
      accountNumber: account_number,
      status: ENUM_TRANSACTION_STATUS.PEENING,
    };

    if (transfer_type === ENUM_TRANSACTION_TYPE.RECHARGE) {
      payload.receiver = user._id; // ID of ADMIN,
      payload.depositor = user._id;
      user.balance += amount;
    }

    const isSuccessCreated = await this.TransactionModel.create(payload);

    if (transfer_type === ENUM_TRANSACTION_TYPE.RECHARGE && isSuccessCreated) {
      isSuccessCreated.status = ENUM_TRANSACTION_STATUS.SUCCEED;
    }
    return {
      transaction: await isSuccessCreated.save(),
      user: await user.save(),
    };
  }
}
