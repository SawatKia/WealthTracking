import { db } from ".././firebase";

export abstract class BaseModel {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  public async createEntity(data: any): Promise<{ id: string }> {
    try {
      const docRef = await db.collection(this.collectionName).add(data);
      return { id: docRef.id };
    } catch (error) {
      throw new Error('Create operation failed');
    }
  }

  public async readEntity(criteria: string, value: any, isFindOne = true): Promise<any> {
    try {
      let query = db.collection(this.collectionName).where(criteria, '==', value);
      const snapshot = await query.get();
      if (snapshot.empty) {
        throw new Error('No matching documents.');
      }
      if (isFindOne) {
        return snapshot.docs[0].data();
      } else {
        return snapshot.docs.map(doc => doc.data());
      }
    } catch (error) {
      throw new Error('Read operation failed');
    }
  }

  public async updateEntity(id: string, updateData: any): Promise<any> {
    try {
      const docRef = db.collection(this.collectionName).doc(id);
      await docRef.update(updateData);
      const updatedDoc = await docRef.get();
      return updatedDoc.data();
    } catch (error) {
      throw new Error('Update operation failed');
    }
  }

  public async deleteEntity(id: string): Promise<boolean> {
    try {
      await db.collection(this.collectionName).doc(id).delete();
      return true;
    } catch (error) {
      throw new Error('Delete operation failed');
    }
  }
}
