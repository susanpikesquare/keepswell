import { IsString, IsOptional, IsIn } from 'class-validator';

export class RegisterTokenDto {
  /** Expo push token from `Notifications.getExpoPushTokenAsync()` on the device. */
  @IsString()
  token: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: 'ios' | 'android' | 'web';

  @IsOptional()
  @IsString()
  device_name?: string;
}
