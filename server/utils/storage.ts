import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface IStorage {
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
   * @returns Array of keys
   */
  list: (prefix?: string) => Promise<string[]>
}

export class S3Storage implements IStorage {
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

  async list(prefix?: string): Promise<string[]> {
    const keys: string[] = []
    let continuationToken: string | undefined

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })

      const response = await this.client.send(command)

      const contents = response?.Contents ?? []
      contents.forEach(i => i.Key && keys.push(i.Key))

      continuationToken = response?.NextContinuationToken
    } while (continuationToken)

    return keys
  }
}
