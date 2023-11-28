import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { blockFieldUser } from "src/shared/constants/blockField";
import { Promotion } from "../schemas/promotions.schema";

@Injectable()
export class PromotionService {
  constructor(
    @InjectModel(Promotion.name) private PromotionModel: Model<Promotion>
  ) {}

  getPromotions(filter: FilterQuery<Promotion>, limit: number, skip: number) {
    return Promise.all([
      this.PromotionModel.find(filter)
        .populate("user", blockFieldUser)
        .populate("voucher")
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 }),
      this.PromotionModel.count(filter),
    ]);
  }
}
