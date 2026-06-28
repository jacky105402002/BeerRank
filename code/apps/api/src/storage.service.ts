import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  UploadedReviewPhotoDto,
  UploadReviewPhotoInputDto,
  UploadReviewPhotosRequestDto,
  UploadReviewPhotosResponseDto
} from "./types";

const MAX_REVIEW_PHOTOS = 3;
const MAX_DATA_URL_LENGTH = 7_000_000;
const IMAGE_DATA_URL_PATTERN = /^data:image\/(png|jpeg|jpg|webp);base64,/i;

@Injectable()
export class StorageService {
  uploadReviewPhotos(body: UploadReviewPhotosRequestDto): UploadReviewPhotosResponseDto {
    const files = this.validateFiles(body);

    return {
      photos: files.map((file, index) => this.toUploadedPhoto(file, index))
    };
  }

  private validateFiles(body: UploadReviewPhotosRequestDto): UploadReviewPhotoInputDto[] {
    if (!Array.isArray(body.files) || body.files.length === 0) {
      throw new BadRequestException("At least one photo is required");
    }

    if (body.files.length > MAX_REVIEW_PHOTOS) {
      throw new BadRequestException("A review can upload at most 3 photos");
    }

    for (const file of body.files) {
      if (!file.fileName?.trim()) {
        throw new BadRequestException("fileName is required");
      }

      if (!file.mimeType?.startsWith("image/")) {
        throw new BadRequestException("Only image uploads are supported");
      }

      if (!IMAGE_DATA_URL_PATTERN.test(file.dataUrl)) {
        throw new BadRequestException("dataUrl must be a base64 image data URL");
      }

      if (file.dataUrl.length > MAX_DATA_URL_LENGTH) {
        throw new BadRequestException("Each photo must be 5 MB or smaller after compression");
      }
    }

    return body.files;
  }

  private toUploadedPhoto(file: UploadReviewPhotoInputDto, index: number): UploadedReviewPhotoDto {
    return {
      url: file.dataUrl,
      fileName: file.fileName.trim(),
      mimeType: file.mimeType,
      sortOrder: index + 1,
      isPrimary: index === 0,
      storageProvider: "mock"
    };
  }
}
