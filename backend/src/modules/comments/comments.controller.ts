import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(ClerkAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('entries/:entryId/comments')
  async getEntryComments(
    @Param('entryId') entryId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.commentsService.findByEntry(entryId, user.userId);
  }

  @Post('entries/:entryId/comments')
  async createComment(
    @Param('entryId') entryId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.commentsService.create(entryId, user.userId, dto);
  }

  @Get('comments/:id')
  async getComment(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.commentsService.findOne(id, user.userId);
  }

  @Patch('comments/:id')
  async updateComment(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.commentsService.update(id, user.userId, dto);
  }

  @Delete('comments/:id')
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.commentsService.remove(id, user.userId);
  }
}
