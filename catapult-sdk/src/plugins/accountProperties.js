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

/** @module plugins/accountProperties */
const EntityType = require('../model/EntityType');
const ModelType = require('../model/ModelType');
const sizes = require('../modelBinary/sizes');

const constants = { sizes };

/**
 * Creates an accountProperties plugin.
 * @type {module:plugins/CatapultPlugin}
 */
const accountPropertiesPlugin = {
	registerSchema: builder => {
		builder.addTransactionSupport(EntityType.accountProperties, {
			propertyType: ModelType.uint64,
			modifications: { type: ModelType.array, schemaName: 'modificationType'}
		});
		builder.addSchema('modificationType', {
			modificationType: Modeltype.uint64,
			value: ModelType.binary
		});
		builder.addSchema('accountProperties', {
			address: ModelType.binary,
			properties: { type: ModelType.array, schemaName: 'accountProperty' }
		});
		builder.addSchema('accountProperty', {
			propertType: ModelType.uint64,
			values: ModelType.binary
		});
	},

	registerCodecs: codecBuilder => {
		codecBuilder.addTransactionSupport(EntityType.accountProperties, {
			deserialize: parser => {
				const transaction = {};
				return transaction;
			},

			serialize: (transaction, serializer) => {
			}
		});
	}
};

module.exports = accountPropertiesPlugin;
