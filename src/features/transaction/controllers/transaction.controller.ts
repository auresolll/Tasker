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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FilterQuery, Model, Types } from 'mongoose';
import { join } from 'path';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { User } from 'src/features/user/schemas/user.schema';
import { RecoverService } from 'src/features/user/services/recover.service';
import { urlPublic } from 'src/main';
import { ENUM_ROLE_TYPE, getAllRoles } from 'src/shared/constants/role';
import { ParseObjectIdPipe } from 'src/shared/pipe/parse-object-id.pipe';
import { Roles } from 'src/shared/utils/roles.decorator';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import {
  CreateTransactionDto,
  CreateTransactionTransferMoneyDto,
} from '../dtos/create-transaction';
import { FetchTransaction } from '../dtos/fetch-transaction';
import {
  ENUM_TRANSACTION_STATUS,
  ENUM_TRANSACTION_TYPE,
  Transaction,
} from '../schemas/transaction.schema';
import { TransactionService } from '../services/transaction.service';
import { pathUpload } from 'src/shared/utils/file-upload.utils';
import * as moment from 'moment';
import * as fs from 'fs';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('accessToken')
@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly recoverService: RecoverService,
    private readonly mailerService: MailerService,

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
  async createTransactionTransferMoney(
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
    @Query() query: CreateTransactionDto,
  ) {
    const { transaction_type, amount, accountNumber } = query;
    const payload: Partial<Transaction> = {
      receiver: user._id,
      depositor: new Types.ObjectId(
        '655dc01ef63e8362106b22d7',
      ) as unknown as User, // ID Of ADMIN
      description: transaction_type,
      amount: amount,
      accountNumber: accountNumber,
      status: ENUM_TRANSACTION_STATUS.PEENING,
    };

    if (transaction_type === ENUM_TRANSACTION_TYPE.RECHARGE) {
      payload.receiver = new Types.ObjectId(
        '655dc01ef63e8362106b22d7',
      ) as unknown as User; // ID of ADMIN,
      payload.depositor = user._id;
      user.balance += amount;
    }

    const isSuccessCreated = await this.TransactionModel.create(payload);

    if (
      transaction_type === ENUM_TRANSACTION_TYPE.RECHARGE &&
      isSuccessCreated
    ) {
      isSuccessCreated.status = ENUM_TRANSACTION_STATUS.SUCCEED;
    }

    return {
      transaction: await isSuccessCreated.save(),
      user: await user.save(),
    };
  }

  @ApiTags('Private Transaction')
  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @Patch('withdrawal')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async updateStatusWithdrawalTransaction(
    @Query('transactionID', new ParseObjectIdPipe()) id: string,
    @Query('receiverID', new ParseObjectIdPipe()) user: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const [transaction, receiver] = await Promise.all([
      this.TransactionModel.findById(id),
      this.UserModel.findById(user),
    ]);

    if (!transaction)
      throw new NotFoundException(`Không tìm thấy #transaction: ${id}`);

    if (!receiver)
      throw new NotFoundException(`Không tìm thấy #receiver: ${user}`);

    if (transaction.description !== ENUM_TRANSACTION_TYPE.WITHDRAWAL)
      throw new NotFoundException(`API này chỉ dành cho rút tiền`);

    transaction.status = ENUM_TRANSACTION_STATUS.SUCCEED;
    receiver.balance -= transaction.amount;

    const nameImage = `receiverID:${user}#transactionID:${id}#Date:${moment().format(
      'yyyy-mm-dd',
    )}#fileName:${image.originalname}`;

    const PATH = `${pathUpload}/${nameImage}`;

    fs.writeFileSync(PATH, image.buffer);

    console.log(
      join(
        urlPublic,
        `assets/uploads/receiverID:6544c8129d85a36c1ddbc67f#transactionID:6569c491c1709e9661d829d6#Date:2023-00-Sa#fileName:316211150_1296404117881454_3040842759036012076_n.jpg`,
      ),
    );

    const sendMail = await this.mailerService.sendMail({
      to: receiver.email,
      subject: 'Trình xác thực (2FA)',
      attachments: [
        {
          name: 'file.ipg',
          path: join(
            urlPublic,
            `assets/uploads/receiverID:6544c8129d85a36c1ddbc67f#transactionID:6569c491c1709e9661d829d6#Date:2023-00-Sa#fileName:316211150_1296404117881454_3040842759036012076_n.jpg`,
          ),
        },
      ],
    });

    const [transactionSucceed, receiverSucceed] = await Promise.all([
      transaction.save(),
      receiver.save(),
    ]);

    return {
      transaction: transactionSucceed,
      receiver: receiverSucceed,
      sendMail: sendMail ? 'Success' : 'Failed',
    };
  }
}
