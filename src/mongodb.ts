import mongoose, { Document, Model } from 'mongoose';

import { CatchErrors } from './decorators.js';

interface DynamicData extends Document {
  _id: mongoose.Types.ObjectId;
  [key: string]: any;
}

const CheckDynamicModel = (
  _target: any,
  _propertyKey: string,
  descriptor: PropertyDescriptor
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const originalMethod = descriptor.value;

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/require-await
  descriptor.value = async function (this: DbManager, ...args: any[]) {
    if (!this.dynamicModel) {
      throw new Error('[error] mongodb: Dynamic model is not initialized.');
    }
    return originalMethod.apply(this, args);
  };

  return descriptor;
};

export class DbManager {
  private connection: mongoose.Mongoose | null = null;
  private dynamicSchema: mongoose.Schema | null = null;
  public dynamicModel: Model<DynamicData> | null = null;

  @CatchErrors
  public async connect(DbName?: string): Promise<void> {
    if (!this.connection) {
      const dbName: string = configs.EnvConfig.db || DbName || 'db';
      console.log('[core] mongodb: Connecting to database:', dbName);
      this.connection = await mongoose.connect(
        `mongodb://localhost:27017/${dbName}`
      );
      this.dynamicSchema = new mongoose.Schema({}, { strict: false });
      this.dynamicModel = mongoose.model<DynamicData>(
        'DynamicCollection',
        this.dynamicSchema
      );
    }
  }

  @CatchErrors
  public async close(): Promise<void> {
    if (this.connection) {
      await this.connection.disconnect();
      this.connection = null;
      console.log('[core] mongodb: Database connection closed.');
    }
  }

  @CatchErrors
  @CheckDynamicModel
  public async saveData(data: DynamicData | unknown): Promise<string> {
    const document: DynamicData = new this.dynamicModel!(data);
    await document.save();
    console.log('[core] mongodb: Data saved:', document);
    return document._id.toString();
  }

  @CatchErrors
  @CheckDynamicModel
  public async fetchData(
    query: Partial<DynamicData> = {}
  ): Promise<DynamicData[]> {
    const documents: DynamicData[] = await this.dynamicModel!.find(
      query as any
    );
    console.log('[core] mongodb: Fetched data:', documents);
    return documents;
  }

  @CatchErrors
  @CheckDynamicModel
  public async fetchDataById(id: string): Promise<DynamicData | null> {
    const document: DynamicData | null = await this.dynamicModel!.findById(id);
    console.log('[core] mongodb: Fetched data by ID:', document);
    return document;
  }

  @CatchErrors
  @CheckDynamicModel
  public async deleteDataById(id: string): Promise<DynamicData | null> {
    const deletedDocument: DynamicData | null =
      await this.dynamicModel!.findByIdAndDelete(id);
    console.log('[core] mongodb: Deleted data:', deletedDocument);
    return deletedDocument;
  }

  @CatchErrors
  @CheckDynamicModel
  public async updateDataById(
    id: string,
    data: Partial<DynamicData>
  ): Promise<DynamicData | null> {
    const updatedDocument: DynamicData | null =
      await this.dynamicModel!.findByIdAndUpdate(id, data, { new: true });
    console.log('[core] mongodb: Updated data:', updatedDocument);
    return updatedDocument;
  }
}
