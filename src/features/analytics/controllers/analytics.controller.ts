import { Body, Controller, Delete, Get, Param, Patch } from "@nestjs/common";
import { AuthNotRequired } from "src/features/auth/decorators/auth-not-required.decorator";
import { UpdateAnalyticsDto } from "../dtos/update-analytics.dto";
import { AnalyticsService } from "../services/analytics.service";
import { CurrentUser } from "src/features/auth/decorators/current-user.decorator";
import { User } from "src/features/user/schemas/user.schema";
import { ENUM_ROLE_TYPE } from "src/shared/constants/role";
import { Roles } from "src/shared/utils/roles.decorator";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(ENUM_ROLE_TYPE.SELLER)
  @AuthNotRequired()
  @Get()
  getDashboardOverviewSeller(@CurrentUser() user: User) {
    return this.analyticsService.getDashboardOverviewSeller(user);
  }

  @Get()
  findAll() {
    return this.analyticsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.analyticsService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateAnalyticsDto: UpdateAnalyticsDto
  ) {
    return this.analyticsService.update(+id, updateAnalyticsDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.analyticsService.remove(+id);
  }
}
