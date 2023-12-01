import { User } from './../../user/schemas/user.schema';
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { blockFieldUser } from "src/shared/constants/blockField";
import { Transaction } from "../schemas/transaction.schema";

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private TransactionModel: Model<Transaction>
  ) {}

  async getTransactions(
    filter: FilterQuery<Transaction>,
    limit: number,
    skip: number
  ) {
    return Promise.all([
      this.TransactionModel.find(filter)
        .populate("user", blockFieldUser)
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
}
