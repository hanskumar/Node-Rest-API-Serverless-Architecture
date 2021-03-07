'use strict';
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();


function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}

module.exports.createProduct = (event, context, callback) => {

  const datetime = new Date().toISOString();
  const Reqbody = JSON.parse(event.body);

  if (!Reqbody.name || Reqbody.name.trim() === '' || !Reqbody.price || Reqbody.price.trim() === '' || !Reqbody.description || Reqbody.description.trim() === '') {
    return callback(
      null,
      response(400, {error: 'Product must have a title and body and they must not be empty'})
    );
  }

  const params = {
      TableName: 'products',
      Item: {
          id: uuidv4(),
          name:Reqbody.name,
          price:Reqbody.price,
          description:Reqbody.description,
          status: false,
          createdAt: datetime,
          updatedAt: datetime
      }
  };

  dynamoDb.put(params, (error, data) => {
      if(error) {
          callback(new Error(error));
          return;
      }

      const response = {
        statusCode: 200,
        body: JSON.stringify({ "message":"Product Added Successfully" })
    };

    callback(null, response);

  });
}

/**
 * GET All Products
 */
module.exports.getProducts = (event, context, callback) => {
    const params = {
        TableName: 'products'
    };

    dynamoDb.scan(params, (error, data) => {
      if(error) {
          callback(new Error(error));
          return;
      }

        const response = data ? {
            statusCode: 200,
            body: JSON.stringify(data)
        }: {
            statusCode: 404,
            body: JSON.stringify({ "message" : 'Products not found' })
        }; 

        callback(null, response);
  });

};

/**
 * Get single product Detail
 */
module.exports.getProduct = (event, context, callback) => {

  const params = {
      TableName: 'products',
      Key: {
          id: event.pathParameters.id
      }
  };

  dynamoDb.get(params, (error, data) => {
      if(error) {
          console.error(error);
          callback(new Error(error));
          return;
      }

      const response = data.Item ? {
          statusCode: 200,
          body: JSON.stringify(data.Item)
      }: {
          statusCode: 404,
          body: JSON.stringify({ "message" : 'Product not found' })
      }; 

      callback(null, response);
  });
}


/**
 * Update products
 */
module.exports.updateProduct = (event, context, callback) => {

  const datetime = new Date().toISOString();
  const Reqbody = JSON.parse(event.body);

  if (!Reqbody.name || !Reqbody.price || !Reqbody.description) {
      console.error('Product Info should not be empty');
      const response = {
          statusCode: 400,
          body: JSON.stringify({ "message":"Product Info should not be empty" })
      }

      return;
  }

  const params = {
      TableName: 'products',
      Key: {
          id: event.pathParameters.id
      },
      ExpressionAttributeValues: {
          ':p': Reqbody.price,
          ':d': Reqbody.description,
          ':u': datetime
      },
      UpdateExpression: 'set description = :d, price = :p, updatedAt = :u'
  };

  dynamoDb.update(params, (error, data) => {
      if(error) {
          console.error(error);
          callback(new Error(error));
          return;
      }

      const response = {
          statusCode: 200,
          body: JSON.stringify(data.Item)
      };

      callback(null, response);
  });
}

/**
 * Delete Product
 */
module.exports.deleteProduct = (event, context, callback) => {

  const params = {
      TableName: 'products',
      Key: {
          id: event.pathParameters.id
      }
  };

  dynamoDb.delete(params, (error, data) => {
      if(error) {
          console.error(error);
          callback(new Error(error));
          return;
      }

      const response = {
          statusCode: 200,
          body: JSON.stringify({ "message":"Product Deleted Successfully" })
      };

      callback(null, response);
  });
}


/**
 * Search product Detail
 */
module.exports.serachProduct = (event, context, callback) => {

  const Reqbody = JSON.parse(event.body);

  var params = {
    KeyConditionExpression: 'description = :description',
    ExpressionAttributeValues: {
        ':description': {'S': Reqbody.description}
    },
    TableName: 'products'
};

  dynamoDb.query(params, (error, data) => {
      if(error) {
          console.error(error);
          callback(new Error(error));
          return;
      }

      const response = data.Item ? {
          statusCode: 200,
          body: JSON.stringify(data.Item)
      }: {
          statusCode: 404,
          body: JSON.stringify({ "message" : 'Product not found' })
      }; 

      callback(null, response);
  });
}