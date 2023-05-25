import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, UserDocument } from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  protected readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard) //this guard guarantees that
  //if the token is valid the user will be attached to the
  //request, so below we can just return the user
  async getUser(@CurrentUser() user: UserDocument) {
    this.logger.log('Attaching the user to the request context: ' + user);
    return user;
  }
}
