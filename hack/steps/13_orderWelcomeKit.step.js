import { updateKitStatusByToken } from '../lib/googleSheets.js';
import connectToDatabase from '../lib/db.js';
import Employee from '../models/Employee.js';

export const config = {
    name: 'OrderWelcomeKit',
    type: 'event',
    subscribes: ['details.received'],
    flows: ['EmployeeFlow'],
    emits: ['kit.ordered'],
    description: 'Autonomously orders a Welcome Kit (via ShipEngine) to the employees present address.'
};


export const handler = async (event, { logger, emit }) => {
    const { token } = event.data || event;

    if (logger) logger.info(`🎁 Initiating Welcome Kit Order for Token: ${token}`);

    try {
        await connectToDatabase();
        const employee = await Employee.findOne({ token });

        if (!employee) {
            if (logger) logger.error(`❌ Employee not found for token: ${token}`);
            return;
        }

        if (employee.welcomeKit && employee.welcomeKit.status === 'ORDERED') {
            if (logger) logger.info(`⚠️ Welcome Kit already ordered for ${token}. Skipping duplicate request.`);
            return;
        }

        const details = employee.details;
        if (!details) {
            if (logger) logger.error(`❌ Employee details not found for token: ${token}`);
            return;
        }

        const fullName = details.get('fullName');
        const mobile = details.get('mobile');
        const presentAddress = details.get('presentAddress');

        if (!fullName || !mobile || !presentAddress) {
            if (logger) logger.error(`❌ Incomplete details for kit order. Name: ${fullName}, Mobile: ${mobile}, Addr: ${!!presentAddress}`);
            return;
        }

        const apiKey = process.env.SHIPENGINE_API_KEY;

        if (!apiKey) {
            if (logger) logger.error('❌ Missing SHIPENGINE_API_KEY');
            return;
        }

        const shipmentPayload = {
            shipment: {
                service_code: "ups_worldwide_expedited",
                ship_to: {
                    name: fullName,
                    phone: mobile,
                    address_line1: presentAddress.substring(0, 60),
                    city_locality: "Bangalore",
                    state_province: "KA",
                    postal_code: "560001",
                    country_code: "IN",
                    address_residential_indicator: "yes"
                },
                ship_from: {
                    name: "HR Department",
                    phone: "512-555-5555",
                    company_name: "Tech Corp",
                    address_line1: "4009 Marathon Blvd",
                    city_locality: "Austin",
                    state_province: "TX",
                    postal_code: "78756",
                    country_code: "US",
                    address_residential_indicator: "no"
                },
                packages: [
                    {
                        weight: {
                            value: 50,
                            unit: "ounce"
                        },
                        dimensions: {
                            unit: "inch",
                            length: 12,
                            width: 12,
                            height: 6
                        }
                    }
                ],
                customs: {
                    contents: "merchandise",
                    non_delivery: "return_to_sender",
                    customs_items: [
                        {
                            description: "Welcome Kit (T-Shirt, Laptop)",
                            quantity: 1,
                            value: {
                                currency: "usd",
                                amount: 50.00
                            },
                            harmonized_tariff_code: "610910",
                            country_of_origin: "US"
                        }
                    ]
                }
            }
        };

        const response = await fetch('https://api.shipengine.com/v1/labels', {
            method: 'POST',
            headers: {
                'API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shipmentPayload)
        });

        const result = await response.json();

        if (response.ok) {
            const labelUrl = result.label_download?.href || 'N/A';
            const trackingNumber = result.tracking_number || 'N/A';

            if (logger) {
                logger.info(`✅ Welcome Kit Label Created!`);
                logger.info(`📦 Tracking Number: ${trackingNumber}`);
                logger.info(`📄 Label URL: ${labelUrl}`);
            }

            await updateKitStatusByToken(token, 'ORDERED');
            if (logger) logger.info(`📊 Updated Google Sheet Kit Status (Col N) to ORDERED`);

            employee.welcomeKit = {
                status: 'ORDERED',
                trackingNumber: trackingNumber,
                labelUrl: labelUrl,
                orderedAt: new Date()
            };
            await employee.save();
            if (logger) logger.info(`💾 Updated MongoDB with Welcome Kit Details`);

            if (emit) {
                await emit({
                    topic: 'kit.ordered',
                    data: {
                        token,
                        email: employee.email,
                        fullName,
                        trackingNumber,
                        labelUrl
                    }
                });
            }

        } else {
            if (logger) {
                logger.warn('⚠️ ShipEngine API Request Failed (Simulation Mode)');
                logger.warn(`Error Details: ${JSON.stringify(result)}`);
            }
            await updateKitStatusByToken(token, 'FAILED');

            employee.welcomeKit = {
                status: 'FAILED',
                orderedAt: new Date()
            };
            await employee.save();
        }

    } catch (error) {
        if (logger) logger.error('❌ Error processing Welcome Kit Order', error);
    }
};
