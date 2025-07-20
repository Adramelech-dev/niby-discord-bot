/* eslint-disable @typescript-eslint/ban-ts-comment */
import mongoose from 'mongoose';

if(process.env.CACHE_DB !== "true"){
   mongoose.Query.prototype.cacheQuery = function() {
      return this.exec();
  };
}

function findOrCreate(this: typeof mongoose.Model, condition: object = {}, createWith: object = {}) {
   return new Promise((resolve, reject) => {
      this.findOne(condition)
         .cacheQuery()
         .then((data) => {
            if (!data) {
               data = new this(createWith.isValid() ? createWith : condition);
               return data.save();
            }
            return data;
         })
         .then((data) => {
            resolve(data);
         })
         .catch((error) => {
            reject(error);
         });
   });
}

function getRandom(this: typeof mongoose.Model, condition: object = {}) {
   return new Promise((resolve, reject) => {
      this.find(condition)
         .then((data) => {
            resolve(data.random());
         })
         .catch((error) => {
            reject(error);
         });
   });
}

// ASIGNAR AL MODELO O SI NO, NO FUNCIONARÁ

Object.assign(mongoose.Model, {
   findOrCreate,
   getRandom,
});
