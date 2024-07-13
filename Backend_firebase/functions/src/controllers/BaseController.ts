import { Request } from 'express';
// import { UserModel } from '../services/UserModel';

import logger from '../logger';

interface Params {
    [key: string]: any;
  }

export abstract class BaseController {
    /**
 * Verifies that all required parameters are present and not empty.
 * 
 * @swagger
 * /api/example:
 *   post:
 *     summary: Example endpoint using verifyParams
 *     description: This endpoint demonstrates the use of verifyParams function
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: number
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *       400:
 *         description: Bad request - missing required parameter
 * 
 * @param {Params} params - An object containing the parameters to verify
 * @param {string[]} requiredFields - An array of field names that are required
 * @throws {Error} Throws an error if a required field is missing or empty
 * 
 * @example
 * // This will throw an error because 'email' is missing
 * verifyParams({ name: 'John', age: 30 }, ['name', 'age', 'email']);
 * 
 * @example
 * // This will not throw an error
 * verifyParams({ name: 'John', age: 30, email: 'john@example.com' }, ['name', 'age', 'email']);
 */
  protected verifyParams(params: Params, requiredFields: string[]): void {
    logger.debug('Verifying parameters');
    logger.debug(`Required fields: ${requiredFields}`);
    logger.debug(`Params: ${params}`);
    if (!params || !requiredFields) {
      throw new Error('parameters or requiredFields is undefined');
    }
    for (const field of requiredFields) {
      logger.debug(`Verifying ${field}: ${params[field]}`);
      if (!(field in params) || params[field] === null || params[field] === undefined || params[field] === '') {
        logger.debug(`${field} is missing or empty`);
        throw new Error(`${field} is required`);
      }
      logger.debug(`${field} is valid`);
    }
  }

  protected async verifyRightToModify(request: Request, entityId: string, Model: any) {
    // const user = await this.getCurrentUser(request);
    // const entity = await Model.read('id', entityId);
    // if (entity.userUniqueId !== user.id) {
    //   throw new Error('Permission denied');
    // }
  }

  protected async getCurrentUser(request: Request) {
    // const userId = this.decodeToken(request.cookies.token);
    // const user = await UserModel.getUserById(userId);
    // if (!user) {
    //   throw new Error('User not found');
    // }
    // return user;
  }

  protected isToken(request: Request) {
    if (!request.cookies.token) {
      throw new Error('Missing token in the body');
    }
  }

  protected decodeToken(token: string): string {
    // Decoding logic here
    return 'decodedUserId';
  }
}
