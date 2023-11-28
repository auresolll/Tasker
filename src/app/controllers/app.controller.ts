import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

@Controller()
export class AppController {
    constructor() {}

    @Get()
    getHello(): string {
        return 'Hello World!';
    }
}
