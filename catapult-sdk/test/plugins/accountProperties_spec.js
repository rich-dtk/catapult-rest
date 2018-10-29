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

const { PropertyTypeEnum, propertyTypeListToPropertyType, accountPropertiesPlugin } = require('../../src/plugins/accountProperties');

describe('account properties plugin', () => {
	describe('property types enum', () => {
		it('contains valid values', () => {
			// Assert:
			expect(PropertyTypeEnum.address).to.equal(1);
			expect(PropertyTypeEnum.mosaicId).to.equal(2);
			expect(PropertyTypeEnum.transactionType).to.equal(4);
		});
	});

	describe('property type list to property type', () => {
		it('returns the same type for blacklists and whitelists', () => {
			// Assert:
			expect(propertyTypeListToPropertyType(0x00)).to.equal(propertyTypeListToPropertyType(0x80));
			expect(propertyTypeListToPropertyType(0x7F)).to.equal(propertyTypeListToPropertyType(0xFF));
		});
		it('returns the expected value', () => {
			// Assert:
			expect(propertyTypeListToPropertyType(0x1)).to.equal(PropertyTypeEnum.address);
			expect(propertyTypeListToPropertyType(0x2)).to.equal(PropertyTypeEnum.mosaicId);
			expect(propertyTypeListToPropertyType(0x4)).to.equal(PropertyTypeEnum.transactionType);
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
			expect(Object.keys(modelSchema).length).to.equal(numDefaultKeys + 4);
			expect(modelSchema).to.contain.all.keys([
				'accountProperties',
				'accountProperties.modificationType',
				'accountProperties.accountProperties',
				'accountProperties.accountProperty'
			]);

			// - accountProperties
			expect(Object.keys(modelSchema.accountProperties).length).to.equal(Object.keys(modelSchema.transaction).length + 2);
			expect(modelSchema.accountProperties).to.contain.all.keys(['propertyType', 'modifications']);

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

		it('adds account properties codec', () => {
			// Act:
			const codecs = getCodecs();

			// Assert: codec was registered
			expect(Object.keys(codecs).length).to.equal(1);
			expect(codecs).to.contain.all.keys([EntityType.accountProperties.toString()]);
		});

		const getCodec = () => getCodecs()[EntityType.accountProperties];

		describe('supports account properties with no modifications', () => {
			test.binary.test.addAll(getCodec(), 2, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.address), // property type
					Buffer.of(0x00) // modifications count
				]),
				object: {
					propertyType: PropertyTypeEnum.address,
					modifications: []
				}
			}));
			test.binary.test.addAll(getCodec(), 2, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.mosaicId), // property type
					Buffer.of(0x00) // modifications count
				]),
				object: {
					propertyType: PropertyTypeEnum.mosaicId,
					modifications: []
				}
			}));
			test.binary.test.addAll(getCodec(), 2, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.transactionType), // property type
					Buffer.of(0x00)// modifications count
				]),
				object: {
					propertyType: PropertyTypeEnum.transactionType,
					modifications: []
				}
			}));
		});

		describe('supports account properties with modifications', () => {
			const testAddress = test.random.bytes(test.constants.sizes.addressDecoded);
			test.binary.test.addAll(getCodec(), 28, () => ({
				buffer: Buffer.concat([
					Buffer.of(PropertyTypeEnum.address), // property type
					Buffer.of(0x01), // modifications count
					Buffer.of(0x00), // modification type
					Buffer.from(testAddress) // address
				]),
				object: {
					propertyType: PropertyTypeEnum.address,
					modifications: [{
						modificationType: 0x00,
						value: testAddress
					}]
				}
			}));
		});
	});
});
