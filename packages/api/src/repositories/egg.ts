import crypto from 'crypto'
import { Collection, Db } from 'mongodb'
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from 'unique-names-generator'

import { EGG_KEY_LENGTH_BYTES, EGG_KEY_SALT } from '../constants'
import { Egg } from '../types'

export class EggRepository {
  private collection: Collection

  constructor(db: Db) {
    this.collection = db.collection('eggs')
  }

  /**
   * Generate as many eggs as specified in the `count` argument.
   * @param count How many eggs to generate
   * @param force If provided and set to `true`, circumvent the double bootstrapping protection.
   */
  public async bootstrap(
    count: Number,
    force: Boolean = false
  ): Promise<Array<Egg> | null> {
    // Tell if the collection is already bootstrapped
    const isAlreadyBootstrapped =
      (await this.collection.estimatedDocumentCount()) > 0

    // Prevent accidental bootstrapping if the collection is already bootstrapped
    if (isAlreadyBootstrapped && !force) {
      return null
    }

    // Generate `count` eggs
    const eggs = []
    for (let index = 0; index < count; index++) {
      // Generate the egg data.
      // First we derive a deterministic 32-bytes sequence of bytes from a fixed salt plus the egg nonce.
      const seed = crypto
        .createHash('sha256')
        .update(`${EGG_KEY_SALT}|${index}`)
        .digest()
      // We will be using the hexadecimal representation of the first `EGG_ID_LENGTH_BYTES` of the seed as the egg key.
      const key: string = seed.slice(0, EGG_KEY_LENGTH_BYTES).toString('hex')
      // The rest of the bytes of the seed will be used for seeding the unique names generator.
      const username: string = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        seed: seed.slice(EGG_KEY_LENGTH_BYTES).readUInt32BE(),
        separator: '-',
        style: 'lowerCase',
      })
      // Create an egg based on that egg data and push it to our collection
      const egg: Egg = { key, index, username }
      await this.create(egg)
      eggs.push(egg)
    }

    return eggs
  }

  public async create(egg: Egg): Promise<Egg> {
    const isAlreadyCreated = await this.get(egg.key)

    if (isAlreadyCreated) {
      throw new Error(`Egg with key ${egg.key} already exists`)
    }

    const success = await this.collection.insertOne(egg)

    if (!success.acknowledged)
      throw new Error(`Egg could not be created (key: ${egg.key})`)

    return egg
  }

  public async update(egg: Egg): Promise<Egg> {
    const isAlreadyCreated = await this.get(egg.key)

    if (!isAlreadyCreated) {
      throw new Error(`Egg does not exist (key: ${egg.key})`)
    }

    const success = await this.collection.updateOne(
      { key: egg.key },
      { $set: egg },
      { upsert: false }
    )

    if (!success.acknowledged)
      throw new Error(`Egg could not be updated (key: ${egg.key})`)

    return egg
  }

  public async get(key: string): Promise<Egg | null> {
    return ((await this.collection.findOne({ key })) as Egg) || null
  }
}
