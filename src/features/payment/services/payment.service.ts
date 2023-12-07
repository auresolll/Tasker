import { User } from '../../user/schemas/user.schema';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { blockFieldUser } from 'src/shared/constants/blockField';
import {
  ENUM_TRANSACTION_STATUS,
  ENUM_TRANSACTION_TYPE,
  Transaction,
} from '../schemas/transaction.schema';
import * as moment from 'moment';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Transaction.name) private TransactionModel: Model<Transaction>,
    @InjectModel(User.name) private UserModel: Model<User>,
  ) {}

  async generatePaymentUrl(
    ipAddress: string,
    amount: number,
    orderInfo: string,
    returnUrl: string,
  ) {
    let vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    let secretKey: string = 'NFDCLZENBIXDCHBWGNCCITSSTUUUSWKF';

    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    let orderID = moment(date).format('DDHHmmss');
    let params: any = {
      vnp_Version: '2.1.0',
      vnp_IpAddr: ipAddress,
      vnp_Locale: 'vn',
      vnp_Command: 'pay',
      vnp_TmnCode: 'WWOFAI0K',
      vnp_Amount: amount * 100,
      vnp_CurrCode: 'VND',
      vnp_OrderType: 'topup',
      vnp_OrderInfo: orderInfo,
      vnp_CreateDate: createDate,
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: orderID,
    };

    params = this.sortObject(params);

    let querystring = require('qs');
    let signData = querystring.stringify(params, { encode: false });
    let crypto = require('crypto');
    let hmac = crypto.createHmac('sha512', secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(params, { encode: false });

    return vnpUrl;
  }

  async getTransactions(
    filter: FilterQuery<Transaction>,
    limit: number,
    skip: number,
  ) {
    return Promise.all([
      this.TransactionModel.find(filter)
        .populate('receiver', blockFieldUser)
        .populate('depositor', blockFieldUser)
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 }),
      this.TransactionModel.count(filter),
    ]);
  }

  public getDirectTransactionMySelfFilter(
    user: User,
  ): FilterQuery<Transaction> {
    return {
      $or: [
        {
          receiver: user._id,
        },
        {
          depositor: user._id,
        },
      ],
    };
  }

  async createRecharge(user: User, amount: number) {
    const administrator = await this.UserModel.findById(
      '6544c8129d85a36c1ddbc67f',
    );

    if (!administrator)
      throw new NotFoundException('Không tìm thấy tài khoản #Administrator');

    const payloadCustomer: Partial<Transaction> = {
      receiver: administrator._id,
      depositor: user._id,
      description: ENUM_TRANSACTION_TYPE.RECHARGE,
      status: ENUM_TRANSACTION_STATUS.PEENING,
      amount: amount,
    };

    return this.TransactionModel.create(payloadCustomer);
  }

  public sortObject(obj: any) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  filterQueryString(url: string, allowedParams: string[]) {
    const urlObj = new URL(`https://example.com/path?${url}`);
    const params = new URLSearchParams(urlObj.search);

    const filteredParams = {};

    allowedParams.forEach((param) => {
      if (params.has(param)) {
        filteredParams[param] = params.get(param);
      }
    });

    return filteredParams;
  }
}
