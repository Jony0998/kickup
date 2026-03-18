import {
    Controller,
    Post,
    Req,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { AuthGuard } from '../../auth/auth.guard';

const ALLOWED_IMAGE_TYPES = ['members', 'matches', 'teams', 'properties'];

function getImageType(req: any): string {
    const type = (req?.query?.type || req?.body?.type || 'members').toString().toLowerCase();
    return ALLOWED_IMAGE_TYPES.includes(type) ? type : 'members';
}

@Controller('uploader')
export class UploaderController {
    @Post('image')
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const type = getImageType(req);
                    const path = join(process.cwd(), 'uploads', 'images', type);
                    if (!existsSync(path)) {
                        mkdirSync(path, { recursive: true });
                    }
                    cb(null, path);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = uuidv4();
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                    return cb(new BadRequestException('Only image files are allowed!'), false);
                }
                cb(null, true);
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: { query?: { type?: string } },
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const type = getImageType(req);
        const serverUrl = process.env.API_URL || 'http://localhost:3008';
        const imageUrl = `${serverUrl}/uploads/images/${type}/${file.filename}`;

        return {
            success: true,
            url: imageUrl,
        };
    }
}
