import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { IdentityService } from '../identity.service';

/**
 * Local Strategy
 * Validates email and password for login
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly identityService: IdentityService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.identityService.login({ email, password });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
