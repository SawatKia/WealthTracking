import { BaseController } from "./BaseController";
import { MemberModel, Member_data } from "../models/MemberModel";

class MemberController extends BaseController{
    public async addMember(request: Request): Promise<string>{
        try {
            const newMember = request.body;
            // this.verifyParams(newMember, ['fname', 'lname', 'age', 'position', 'phone']);
            const result = await MemberModel.createEntity(newMember);
            return result.id;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('An unknown error occurred.');
            }            
        }
    }

    public async getMember(request: Request): Promise<Member_data>{
        const id = request.body;
        this.verifyParams(id, ['id']);
        return await MemberModel.readEntity('id', id);
    }

}
const MemberCont = new MemberController();
export default MemberCont;