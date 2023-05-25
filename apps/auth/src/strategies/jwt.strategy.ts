import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  //this is a strategy for authentication with jwt
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) =>
          request?.cookies?.Authentication ||
          request?.Authentication ||
          request?.headers.Authentication,
      ]),
      secretOrKey: configService.get('JWT_SECRET'), //the same value to
      //verify the cookie as the one it was signed with when the cookie
      //was sent back
    });
  }

  async validate({ userId }: TokenPayload) {
    this.logger.log('Strategy:validate:(userId:{' + userId + '})');
    //    this.logger.log(this.usersService.getUser({ _id: userId }));
    return this.usersService.getUser({ _id: userId });
  }
}
