const CustomerService = require("../services/customer-service");

appEvents = (app) => {

    // {"payload":{
    //     "event":"TEST",
    //     "data":[]
    //   }}
    

    const service = new CustomerService();
    app.use('/app-events',async (req,res,next) => {

        const { payload } = req.body;

        //handle subscribe events
        service.SubscribeEvents(payload);

        console.log("============= CUSTOMER ================");
       res.json(payload)
    });

}
module.exports=appEvents