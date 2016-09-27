class Item {

    constructor(args={}) {
        if(!args.model || !args.attrs) {
            throw new Error('Invalid arguments');
        }
        args = Object.assign({}, args);
        Object.assign(this, args);

        //Set all item methods on instance
        Object.assign(this, args.model.methods);

    }
}

module.exports = Item;
