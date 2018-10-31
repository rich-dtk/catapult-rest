/*
 * Copyright (c) 2016-present,
 * Jaguar0625, gimre, BloodyRookie, Tech Bureau, Corp. All rights reserved.
 *
 * This file is part of Catapult.
 *
 * Catapult is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Catapult is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Catapult.  If not, see <http://www.gnu.org/licenses/>.
 */

const MongoDb = require('mongodb');
const AccountPropertiesDb = require('../../../../src/plugins/db/AccountPropertiesDb');
const test = require('../../../testUtils');
const dbTestUtils = require('../../../db/utils/dbTestUtils');
const catapult = require('catapult-sdk');
const crypto = require('crypto');

const { Binary, Long } = MongoDb;
const { sizes } = catapult.constants;
const { EntityType } = catapult.model;


const createAccountPropertiesProperties = properties => {
	const propertiesObject = [];
	var i;

	var values = [];
	for (i=0; i< properties.address; i++)
		values.push(new Binary(crypto.randomBytes(sizes.addressDecoded)));
	propertiesObject.push({
		propertyType: Math.random() < 0.5 ? 1 : 129,
		values: values,
	});

	values = [];
	for (i=0; i< properties.mosaic; i++)
		values.push(Math.floor(Math.random() * 1000));
	propertiesObject.push({
		propertyType: Math.random() < 0.5 ? 2 : 130,
		values: values,
	});

	values = [];
	for (i=0; i< properties.entityType; i++) {
		const entityKeys = Object.keys(EntityType)
		values.push(EntityType[entityKeys[Math.floor(entityKeys.length * Math.random())]])
	};
	propertiesObject.push({
		propertyType: Math.random() < 0.5 ? 4 : 132,
		values: values,
	});

	return propertiesObject; 
};

const createAccountProperties = (address, properties) => {
	const accountProperties = {
		address: new Binary(address),
		properties: createAccountPropertiesProperties(properties),
	};
	return { _id: dbTestUtils.db.createObjectId(Math.floor(Math.random() * 10000)), meta: {}, accountProperties };
};


const accountPropertiesDbTestUtils = {
	db: {
		createAccountProperties,
		runDbTest: (dbEntities, issueDbCommand, assertDbCommandResult) =>
			dbTestUtils.db.runDbTest(dbEntities, 'accountProperties', db => new AccountPropertiesDb(db), issueDbCommand, assertDbCommandResult)
	}
};
Object.assign(accountPropertiesDbTestUtils, test);

module.exports = accountPropertiesDbTestUtils;
