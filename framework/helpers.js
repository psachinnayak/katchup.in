export class Helpers {
    static createController(cls){
        let controller = new cls();
        return controller.execute.bind(controller);
    }
}


