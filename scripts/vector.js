export default class Vector {

    constructor(x, y) {
      if (x instanceof Vector) {
        y = x.y;
        x = x.x;
      }
      if (typeof y !== 'number') {
        y = x;
      }
      this.x = x;
      this.y = y;
    }
  
    add(x, y) {
      return this.operate(x, y, '+');
    }
  
    subtract(x, y) {
      return this.operate(x, y, '-');
    }
  
    multiply(x, y) {
      return this.operate(x, y, '*');
    }
  
    divide(x, y) {
      return this.operate(x, y, '/');
    }
  
    operate(x, y, operation) {
      if (x instanceof Vector) {
        y = x.y;
        x = x.x;
      }
      if (typeof y !== 'number') {
        y = x;
      }
      switch (operation) {
        case '+':
          return new Vector(this.x + x, this.y + y);
        case '-':
          return new Vector(this.x - x, this.y - y);
        case '*':
          return new Vector(this.x * x, this.y * y);
        case '/':
          return new Vector(this.x / x, this.y / y);
      }
    }
  }