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

const { expect } = require('chai');
const EntityType = require('../../src/model/EntityType');
const ModelSchemaBuilder = require('../../src/model/ModelSchemaBuilder');
const test = require('../binaryTestUtils');

const { PropertyTypeEnum, accountPropertiesPlugin } = require('../../src/plugins/accountProperties');

describe('account properties plugin', () => {
	describe('property types enum', () => {
		it('contains valid values', () => {
			// Assert:
			expect(PropertyTypeEnum.addressAllow).to.equal(1);
			expect(PropertyTypeEnum.mosaicAllow).to.equal(2);
			expect(PropertyTypeEnum.entityTypeAllow).to.equal(4);
		});
	});

	describe('register schema', () => {
		it('adds account properties system schema', () => {
			// Arrange:
			const builder = new ModelSchemaBuilder();
			const numDefaultKeys = Object.keys(builder.build()).length;

			// Act:
			accountPropertiesPlugin.registerSchema(builder);
			const modelSchema = builder.build();

			// Assert:
			expect(Object.keys(modelSchema).length).to.equal(numDefaultKeys + 6);
			expect(modelSchema).to.contain.all.keys([
				'accountPropertiesAddress',
				'accountPropertiesMosaic',
				'accountPropertiesEntityType',
				'accountProperties.modificationType',
				'accountProperties.accountProperties',
				'accountProperties.accountProperty'
			]);

			// accountPropertiesAddress
			expect(Object.keys(modelSchema.accountPropertiesAddress).length).to.equal(Object.keys(modelSchema.transaction).length + 2);
			expect(modelSchema.accountPropertiesAddress).to.contain.all.keys(['propertyType', 'modifications']);

			// accountPropertiesMosaic
			expect(Object.keys(modelSchema.accountPropertiesMosaic).length).to.equal(Object.keys(modelSchema.transaction).length + 2);
			expect(modelSchema.accountPropertiesMosaic).to.contain.all.keys(['propertyType', 'modifications']);

			// accountPropertiesEntityType
			expect(Object.keys(modelSchema.accountPropertiesEntityType).length).to.equal(Object.keys(modelSchema.transaction).length + 2);
			expect(modelSchema.accountPropertiesEntityType).to.contain.all.keys(['propertyType', 'modifications']);

			// accountProperties.modificationType
			expect(Object.keys(modelSchema['accountProperties.modificationType']).length).to.equal(2);
			expect(modelSchema['accountProperties.modificationType']).to.contain.all.keys(['modificationType', 'value']);

			// accountProperties.accountProperties
			expect(Object.keys(modelSchema['accountProperties.accountProperties']).length).to.equal(2);
			expect(modelSchema['accountProperties.accountProperties']).to.contain.all.keys(['address', 'properties']);

			// accountProperties.accountProperty
			expect(Object.keys(modelSchema['accountProperties.accountProperty']).length).to.equal(2);
			expect(modelSchema['accountProperties.accountProperty']).to.contain.all.keys(['propertyType', 'values']);
		});
	});

	describe('register codecs', () => {
		const getCodecs = () => {
			const codecs = {};
			accountPropertiesPlugin.registerCodecs({
				addTransactionSupport: (type, codec) => { codecs[type] = codec; }
			});

			return codecs;
		};

		it('adds account properties codecs (Address, Mosaic, EntityType)', () => {
			// Act:
			const codecs = getCodecs();

			// Assert: codecs were registered
			expect(Object.keys(codecs).length).to.equal(3);
			expect(codecs).to.contain.all.keys([
				EntityType.accountPropertiesAddress.toString(),
				EntityType.accountPropertiesMosaic.toString(),
				EntityType.accountPropertiesEntityType.toString()
			]);
		});

		const codecAddress = getCodecs()[EntityType.accountPropertiesAddress];
		const codecMosaic = getCodecs()[EntityType.accountPropertiesMosaic];
		const codecEntityType = getCodecs()[EntityType.accountPropertiesEntityType];

		describe('supports account properties address with no modifications', () => {
			test.binary.test.addAll(codecAddress, 2, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.addressAllow), // property type
					Buffer.of(0x00) // modifications count
				]),
				object: {
					propertyType: PropertyTypeEnum.addressAllow,
					modifications: []
				}
			}));
		});

		describe('supports account properties address with modifications ', () => {
			const testAddress = test.random.bytes(test.constants.sizes.addressDecoded);
			test.binary.test.addAll(codecAddress, 28, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.addressAllow), // property type
					Buffer.of(0x01), // modifications count
					Buffer.of(0x00), // modification type
					Buffer.from(testAddress) // address
				]),
				object: {
					propertyType: PropertyTypeEnum.addressAllow,
					modifications: [{
						modificationType: 0x00,
						value: testAddress
					}]
				}
			}));
		});

		describe('supports account properties mosaic with no modifications', () => {
			test.binary.test.addAll(codecMosaic, 2, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.mosaicAllow), // property type
					Buffer.of(0x00) // modifications count
				]),
				object: {
					propertyType: PropertyTypeEnum.mosaicAllow,
					modifications: []
				}
			}));
		});

		describe('supports account properties mosaic with modifications ', () => {
			test.binary.test.addAll(codecMosaic, 11, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.mosaicAllow), // property type
					Buffer.of(0x01), // modifications count
					Buffer.of(0x00), // modification type
					Buffer.of(0xF2, 0x26, 0x6C, 0x06, 0x40, 0x83, 0xB2, 0x92) // mosaicId
				]),
				object: {
					propertyType: PropertyTypeEnum.mosaicAllow,
					modifications: [{
						modificationType: 0x00,
						value: [0x066C26F2, 0x92B28340]
					}]
				}
			}));
		});

		describe('supports account properties entityType with no modifications', () => {
			test.binary.test.addAll(codecEntityType, 2, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.entityTypeAllow), // property type
					Buffer.of(0x00) // modifications count
				]),
				object: {
					propertyType: PropertyTypeEnum.entityTypeAllow,
					modifications: []
				}
			}));
		});

		describe('supports account properties entityType with modifications ', () => {
			const entityTypeId = test.random.bytes(2);

			test.binary.test.addAll(codecEntityType, 5, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.entityTypeAllow), // property type
					Buffer.of(0x01), // modifications count
					Buffer.of(0x00), // modification type
					Buffer.from(entityTypeId) // mosaicId
				]),
				object: {
					propertyType: PropertyTypeEnum.entityTypeAllow,
					modifications: [{
						modificationType: 0x00,
						value: entityTypeId.readUInt16LE()
					}]
				}
			}));
		});
	});
});
