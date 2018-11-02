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

const { accountPropertiesPlugin, accountPropertiesCreateBaseCodec, PropertyTypeEnum } = require('../../src/plugins/accountProperties');

describe('account properties plugin', () => {
	describe('property types enum', () => {
		it('contains valid values', () => {
			// Assert:
			const propertyTypeEnumBlockOffset = 128;
			expect(PropertyTypeEnum.addressAllow).to.equal(1);
			expect(PropertyTypeEnum.addressBlock).to.equal(1 + propertyTypeEnumBlockOffset);
			expect(PropertyTypeEnum.mosaicAllow).to.equal(2);
			expect(PropertyTypeEnum.mosaicBlock).to.equal(2 + propertyTypeEnumBlockOffset);
			expect(PropertyTypeEnum.entityTypeAllow).to.equal(4);
			expect(PropertyTypeEnum.entityTypeBlock).to.equal(4 + propertyTypeEnumBlockOffset);
		});
	});

	describe('account properties create base codec', () => {
		it('creates a correct base codec for every transaction type', () => {
			// Arrange:
			const baseCodecForAdress = accountPropertiesCreateBaseCodec(EntityType.accountPropertiesAddress);
			const baseCodecForMosaic = accountPropertiesCreateBaseCodec(EntityType.accountPropertiesMosaic);
			const baseCodecForEntityType = accountPropertiesCreateBaseCodec(EntityType.accountPropertiesEntityType);
			// Act:
			expect(Object.keys(baseCodecForAdress).length).to.equal(2);
			expect(baseCodecForAdress).to.contain.all.keys(['deserialize', 'serialize']);
			expect(Object.keys(baseCodecForMosaic).length).to.equal(2);
			expect(baseCodecForMosaic).to.contain.all.keys(['deserialize', 'serialize']);
			expect(Object.keys(baseCodecForEntityType).length).to.equal(2);
			expect(baseCodecForEntityType).to.contain.all.keys(['deserialize', 'serialize']);
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

			// - accountPropertiesAddress
			expect(Object.keys(modelSchema.accountPropertiesAddress).length).to.equal(Object.keys(modelSchema.transaction).length + 2);
			expect(modelSchema.accountPropertiesAddress).to.contain.all.keys(['propertyType', 'modifications']);

			// - accountPropertiesMosaic
			expect(Object.keys(modelSchema.accountPropertiesMosaic).length).to.equal(Object.keys(modelSchema.transaction).length + 2);
			expect(modelSchema.accountPropertiesMosaic).to.contain.all.keys(['propertyType', 'modifications']);

			// - accountPropertiesEntityType
			expect(Object.keys(modelSchema.accountPropertiesEntityType).length).to.equal(Object.keys(modelSchema.transaction).length + 2);
			expect(modelSchema.accountPropertiesEntityType).to.contain.all.keys(['propertyType', 'modifications']);

			// - accountProperties.modificationType
			expect(Object.keys(modelSchema['accountProperties.modificationType']).length).to.equal(2);
			expect(modelSchema['accountProperties.modificationType']).to.contain.all.keys(['modificationType', 'value']);

			// - accountProperties.accountProperties
			expect(Object.keys(modelSchema['accountProperties.accountProperties']).length).to.equal(2);
			expect(modelSchema['accountProperties.accountProperties']).to.contain.all.keys(['address', 'properties']);

			// - accountProperties.accountProperty
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

		describe('supports account properties address with modifications', () => {
			const testAddress1 = test.random.bytes(test.constants.sizes.addressDecoded);
			const testAddress2 = test.random.bytes(test.constants.sizes.addressDecoded);
			test.binary.test.addAll(codecAddress, 54, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.addressAllow), // property type
					Buffer.of(0x02), // modifications count
					Buffer.of(0x00), // 1st modification type
					Buffer.from(testAddress1), // 1st address
					Buffer.of(0x01), // 2nd modification type
					Buffer.from(testAddress2) // 2nd address
				]),
				object: {
					propertyType: PropertyTypeEnum.addressAllow,
					modifications: [{
						modificationType: 0x00,
						value: testAddress1
					},
					{
						modificationType: 0x01,
						value: testAddress2
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

		describe('supports account properties mosaic with modifications', () => {
			test.binary.test.addAll(codecMosaic, 20, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.mosaicAllow), // property type
					Buffer.of(0x02), // modifications count
					Buffer.of(0x00), // 1st modification type
					Buffer.of(0xF2, 0x26, 0x6C, 0x06, 0x40, 0x83, 0xB2, 0x92), // 1st mosaicId
					Buffer.of(0x01), // 2nd modification type
					Buffer.of(0xD1, 0x15, 0x5B, 0xF5, 0x3F, 0x72, 0xA1, 0x81) // 2nd mosaicId
				]),
				object: {
					propertyType: PropertyTypeEnum.mosaicAllow,
					modifications: [{
						modificationType: 0x00,
						value: [0x066C26F2, 0x92B28340]
					},
					{
						modificationType: 0x01,
						value: [0xF55B15D1, 0x81A1723F]
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

		describe('supports account properties entityType with modifications', () => {
			test.binary.test.addAll(codecEntityType, 8, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.entityTypeAllow), // property type
					Buffer.of(0x02), // modifications count
					Buffer.of(0x00), // 1st modification type
					Buffer.of(0xF2, 0x83), // 1st entityType
					Buffer.of(0x01), // 2nd modification type
					Buffer.of(0xE1, 0x72) // 2nd entityType
				]),
				object: {
					propertyType: PropertyTypeEnum.entityTypeAllow,
					modifications: [{
						modificationType: 0x00,
						value: 0x83F2
					},
					{
						modificationType: 0x01,
						value: 0x72E1
					}]
				}
			}));
		});
	});
});
