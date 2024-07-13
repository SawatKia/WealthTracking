class PingController {
    public static async ping(): Promise<any> {
      return { message: 'pong' };
    }
  }
  
  export default PingController;
  