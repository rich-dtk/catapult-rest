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

const propertyTypeEnumBlockOffset = 128;
const PropertyTypeEnum = Object.freeze({
	addressAllow: 1,
	addressBlock: 1 + propertyTypeEnumBlockOffset,
	mosaicAllow: 2,
	mosaicBlock: 2 + propertyTypeEnumBlockOffset,
	entityTypeAllow: 4,
	entityTypeBlock: 4 + propertyTypeEnumBlockOffset
});

/**
 * Creates an accountProperties plugin.
 * @type {module:plugins/CatapultPlugin}
 */
const accountPropertiesPlugin = {
	registerSchema: builder => {
		builder.addTransactionSupport(EntityType.accountPropertiesAddress, {
			propertyType: ModelType.uint64,
			modifications: { type: ModelType.array, schemaName: 'accountProperties.modificationType' }
		});
		builder.addTransactionSupport(EntityType.accountPropertiesMosaic, {
			propertyType: ModelType.uint64,
			modifications: { type: ModelType.array, schemaName: 'accountProperties.modificationType' }
		});
		builder.addTransactionSupport(EntityType.accountPropertiesEntityType, {
			propertyType: ModelType.uint64,
			modifications: { type: ModelType.array, schemaName: 'accountProperties.modificationType' }
		});
		builder.addSchema('accountProperties.modificationType', {
			modificationType: ModelType.uint64,
			value: ModelType.binary
		});

		builder.addSchema('accountProperties.accountProperties', {
			address: ModelType.binary,
			properties: { type: ModelType.array, schemaName: 'accountProperties.accountProperty' }
		});
		builder.addSchema('accountProperties.accountProperty', {
			propertyType: ModelType.uint64,
			values: ModelType.binary
		});
	},

	registerCodecs: codecBuilder => {
		codecBuilder.addTransactionSupport(EntityType.accountPropertiesAddress, {
			deserialize: parser => {
				const transaction = {};
				transaction.propertyType = parser.uint8();
				transaction.modifications = [];
				const propertiesCount = parser.uint8();
				for (let i = 0; i < propertiesCount; i++) {
					const modification = {};
					modification.modificationType = parser.uint8();
					modification.value = parser.buffer(constants.sizes.addressDecoded);
					transaction.modifications.push(modification);
				}
				return transaction;
			},
			serialize: (transaction, serializer) => {
				serializer.writeUint8(transaction.propertyType);
				serializer.writeUint8(transaction.modifications.length);
				for (let i = 0; i < transaction.modifications.length; i++) {
					serializer.writeUint8(transaction.modifications[i].modificationType);
					serializer.writeBuffer(transaction.modifications[i].value);
				}
			}
		});

		codecBuilder.addTransactionSupport(EntityType.accountPropertiesMosaic, {
			deserialize: parser => {
				const transaction = {};
				transaction.propertyType = parser.uint8();
				transaction.modifications = [];
				const propertiesCount = parser.uint8();
				for (let i = 0; i < propertiesCount; i++) {
					const modification = {};
					modification.modificationType = parser.uint8();
					modification.value = parser.uint64();
					transaction.modifications.push(modification);
				}
				return transaction;
			},
			serialize: (transaction, serializer) => {
				serializer.writeUint8(transaction.propertyType);
				serializer.writeUint8(transaction.modifications.length);
				for (let i = 0; i < transaction.modifications.length; i++) {
					serializer.writeUint8(transaction.modifications[i].modificationType);
					serializer.writeUint64(transaction.modifications[i].value);
				}
			}
		});

		codecBuilder.addTransactionSupport(EntityType.accountPropertiesEntityType, {
			deserialize: parser => {
				const transaction = {};
				transaction.propertyType = parser.uint8();
				transaction.modifications = [];
				const propertiesCount = parser.uint8();
				for (let i = 0; i < propertiesCount; i++) {
					const modification = {};
					modification.modificationType = parser.uint8();
					modification.value = parser.uint16();
					transaction.modifications.push(modification);
				}
				return transaction;
			},
			serialize: (transaction, serializer) => {
				serializer.writeUint8(transaction.propertyType);
				serializer.writeUint8(transaction.modifications.length);
				for (let i = 0; i < transaction.modifications.length; i++) {
					serializer.writeUint8(transaction.modifications[i].modificationType);
					serializer.writeUint16(transaction.modifications[i].value);
				}
			}
		});
	}
};

module.exports = {
	accountPropertiesPlugin,
	PropertyTypeEnum
};
