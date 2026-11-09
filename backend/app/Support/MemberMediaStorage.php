<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Stores and deletes member photos under public/faces and public/profiles.
 *
 * Paths saved in the database are only ever generated here, and deletes are
 * refused for anything that does not resolve to a file directly inside one
 * of those two folders, so a crafted path such as "/../.env" can never be
 * removed.
 */
class MemberMediaStorage
{
    public const FACES_DIR = 'faces';
    public const PROFILES_DIR = 'profiles';

    /** Matches the data URIs the React camera enrolment sends. */
    public const FACE_DATA_URI_REGEX = '/^data:image\/(png|jpeg|webp);base64,/';

    private const MAX_FACE_BYTES = 10 * 1024 * 1024;

    private const IMAGE_EXTENSIONS = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'image/bmp' => 'bmp',
    ];

    /** Decode a base64 image data URI, verify it is a real image, and save it. */
    public function storeFace(string $dataUri): string
    {
        $invalid = fn () => ValidationException::withMessages([
            'enrolled_face_id' => ['The face enrollment must be a PNG, JPEG or WebP image.'],
        ]);

        if (!preg_match(self::FACE_DATA_URI_REGEX, $dataUri)) {
            throw $invalid();
        }

        $binary = base64_decode(substr($dataUri, strpos($dataUri, ',') + 1), true);
        if ($binary === false || $binary === '' || strlen($binary) > self::MAX_FACE_BYTES) {
            throw $invalid();
        }

        $info = @getimagesizefromstring($binary);
        $extension = $info ? (self::IMAGE_EXTENSIONS[$info['mime']] ?? null) : null;
        if (!$extension || $extension === 'gif' || $extension === 'bmp') {
            throw $invalid();
        }

        $filename = time() . '_face_' . Str::random(16) . '.' . $extension;
        File::ensureDirectoryExists(public_path(self::FACES_DIR), 0755);
        File::put(public_path(self::FACES_DIR . DIRECTORY_SEPARATOR . $filename), $binary);

        return '/' . self::FACES_DIR . '/' . $filename;
    }

    /** Save an uploaded profile picture under a server-generated name. */
    public function storeProfilePicture(UploadedFile $file): string
    {
        $extension = self::IMAGE_EXTENSIONS[$file->getMimeType()] ?? 'jpg';
        $filename = time() . '_profile_' . Str::random(16) . '.' . $extension;

        File::ensureDirectoryExists(public_path(self::PROFILES_DIR), 0755);
        $file->move(public_path(self::PROFILES_DIR), $filename);

        return '/' . self::PROFILES_DIR . '/' . $filename;
    }

    public function deleteFace(?string $storedPath): bool
    {
        return $this->deleteInside(self::FACES_DIR, $storedPath);
    }

    public function deleteProfilePicture(?string $storedPath): bool
    {
        return $this->deleteInside(self::PROFILES_DIR, $storedPath);
    }

    /**
     * Delete $storedPath only if it is a regular file located directly inside
     * public/$directory. Anything else (traversal, other folders, symlinked
     * escapes, nested paths) is ignored.
     */
    private function deleteInside(string $directory, ?string $storedPath): bool
    {
        if (!is_string($storedPath) || $storedPath === '') {
            return false;
        }

        $baseDir = realpath(public_path($directory));
        $target = realpath(public_path(ltrim($storedPath, '/\\')));

        if ($baseDir === false || $target === false || !is_file($target)) {
            return false;
        }

        if (dirname($target) !== $baseDir) {
            return false;
        }

        return File::delete($target);
    }
}
