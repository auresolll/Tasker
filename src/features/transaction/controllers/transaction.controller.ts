import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilterQuery, Model } from 'mongoose';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { User } from 'src/features/user/schemas/user.schema';
import { ENUM_ROLE_TYPE } from 'src/shared/constants/role';
import { Roles } from 'src/shared/utils/roles.decorator';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { FetchTransaction } from '../dtos/fetch-transaction';
import { Transaction } from '../schemas/transaction.schema';
import { TransactionService } from '../services/transaction.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('accessToken')
@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,

    @InjectModel(Transaction.name) private TransactionModel: Model<Transaction>,
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
}
