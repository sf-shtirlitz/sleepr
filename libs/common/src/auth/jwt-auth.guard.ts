import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Reflector } from '@nestjs/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { AUTH_SERVICE } from '../constants/services';
import { UserDto } from '../dto';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy, //standard mechanism
    //brought by microservices module - this is the client (ClientProxy)
    //we are going to use to talk to auth service
    private readonly reflector: Reflector,
  ) {
    console.log('JwtAuthGuard:CanActivate----Constructor');
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('JwtAuthGuard:CanActivate');
    const jwt =
      context.switchToHttp().getRequest().cookies?.Authentication ||
      context.switchToHttp().getRequest().headers?.authentication;

    console.log('jwt=' + jwt);
    if (!jwt) {
      return false;
    }

    console.log('JwtAuthGuard:CanActivate:after if');
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    console.log('JwtAuthGuard:CanActivate:after roles');

    return this.authClient
      .send<UserDto>('authenticate', {
        //sending request to authenticate in auth.controller over TCP
        Authentication: jwt,
      })
      .pipe(
        tap((res) => {
          //tap(...) - executing a side effect on the incoming response
          if (roles) {
            for (const role of roles) {
              if (!res.roles?.includes(role)) {
                this.logger.error('The user does not have valid roles.');
                throw new UnauthorizedException();
              }
            }
          }
          console.log('roles = ' + roles);
          context.switchToHttp().getRequest().user = res;
          //adding user to the current request itself
          console.log('res=' + res);
        }),
        map(() => true),
        catchError((err) => {
          this.logger.error(err);
          return of(false);
        }),
      );
  }
}
