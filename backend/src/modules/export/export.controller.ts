import {
  Controller,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../../common/decorators';

interface ExportPdfDto {
  pageSize?: 'letter' | '6x9' | '8x10';
  includeTableOfContents?: boolean;
}

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('pdf/:journalId')
  @UseGuards(ClerkAuthGuard)
  async exportPdf(
    @Param('journalId') journalId: string,
    @CurrentUser() user: AuthUser,
    @Body() options: ExportPdfDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.exportService.generatePdf(
      journalId,
      user.clerkId,
      options,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="memory-book-${journalId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
