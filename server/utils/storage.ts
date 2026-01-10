import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
  paginateListObjectsV2,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export type FileStorageItem = {
  key: string
  size: number
  etag: string
  createdAt: string
}

export interface FileStorage {
  /**
   * Get a value from the storage as a stream of bytes
   * @param key - The key to get
   * @returns A ReadableStream of bytes or undefined if not found
   */
  get: (key: string) => Promise<ReadableStream<Uint8Array>>

  /**
   * Set a value in the storage from a stream of bytes
   * @param key - The key to set
   * @param stream - The stream of bytes to store
   */
  set: (key: string, stream: ReadableStream<Uint8Array>) => Promise<void>

  /**
   * Delete a value from the storage
   * @param key - The key to delete
   */
  del: (key: string) => Promise<void>

  /**
   * Check if a value exists in the storage
   * @param key - The key to check
   * @returns True if the value exists, false otherwise
   */
  has: (key: string) => Promise<boolean>

  /**
   * Copy a value from one key to another
   * @param from - The source key
   * @param to - The destination key
   */
  copy: (from: string, to: string) => Promise<void>

  /**
   * Get the presigned URL for a value in the storage
   * @param key - The key to get the URL for
   * @returns The URL for the value
   */
  presign: (key: string) => Promise<string>

  /**
   * List all keys in the storage with an optional prefix
   * @param prefix - Optional prefix to filter keys
   * @returns Array of file storage items
   */
  list: (prefix?: string) => Promise<FileStorageItem[]>

  /**
   * Get the metadata for a key
   * @param key - The key to get the metadata for
   * @returns The metadata for the key
   */
  metadata: (key: string) => Promise<Record<string, string>>
}

export class S3Storage implements FileStorage {
  private client: S3Client
  private bucket: string

  constructor(bucket: string) {
    this.bucket = bucket
    this.client = new S3Client({ forcePathStyle: true })
  }

  async get(key: string): Promise<ReadableStream<Uint8Array>> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key })
    const response = await this.client.send(command)
    if (!response.Body) {
      console.error(`Error getting object ${key}:`, response)
      throw new Error(`Object ${key} not found`)
    }
    return response.Body.transformToWebStream()
  }

  async set(key: string, stream: ReadableStream<Uint8Array>): Promise<void> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
      },
    })
    await upload.done()
  }

  async del(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    await this.client.send(command)
  }

  async has(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      await this.client.send(command)
      return true
    }
    catch (error: unknown) {
      if (!(error instanceof Error)) throw error
      if (error.name !== 'NoSuchKey') throw error
      return false
    }
  }

  async copy(from: string, to: string): Promise<void> {
    const command = new CopyObjectCommand({ Bucket: this.bucket, Key: to, CopySource: `${this.bucket}/${from}` })
    await this.client.send(command)
  }

  async presign(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key })
    return await getSignedUrl(this.client, command, { expiresIn: 3600 })
  }

  async metadata(key: string): Promise<Record<string, string>> {
    const command = new HeadObjectCommand({ Bucket: this.bucket, Key: key })
    const response = await this.client.send(command)
    return response.Metadata ?? {}
  }

  async list(prefix?: string): Promise<FileStorageItem[]> {
    const files: FileStorageItem[] = []
    const paginator = paginateListObjectsV2(
      { client: this.client },
      { Bucket: this.bucket, Prefix: prefix },
    )

    for await (const page of paginator) {
      for (const item of page.Contents ?? []) {
        if (item.Key) {
          files.push({
            key: item.Key,
            size: item.Size ?? 0,
            etag: item.ETag ?? '',
            createdAt: item.LastModified?.toISOString() ?? '',
          })
        }
      }
    }

    return files
  }
}
