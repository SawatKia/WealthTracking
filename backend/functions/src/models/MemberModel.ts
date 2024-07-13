import { BaseModel } from "./BaseModel";

export interface Member_data {
    fname: string;
    lname: string;
    age: number;
    position: string;
    phone: string;
  }

class Member extends BaseModel{
    constructor() {
        super('Member');
      }
}
export const MemberModel = new Member();
