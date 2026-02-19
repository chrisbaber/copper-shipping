/** Extracted data from a Bill of Lading photo */
export interface BolExtractedData {
  /** Shipper / Ship From */
  shipFrom: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  /** Consignee / Ship To */
  shipTo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  /** BOL reference number (e.g., THT 2021) */
  bolNumber: string;
  /** Broker load numbers (e.g., KFB #10011) */
  brokerLoadNumber: string;
  /** Commodity description */
  commodity: string;
  /** Weight (e.g., "43,000 pounds") */
  weight: string;
  /** Quantity (e.g., "1,400 bags") */
  quantity: string;
  /** Carrier name */
  carrierName: string;
  /** Driver name */
  driverName: string;
  /** Truck tag number */
  truckTag: string;
  /** Truck/trailer number */
  truckNumber: string;
  /** Pickup date */
  pickupDate: string;
  /** Delivery date */
  deliveryDate: string;
  /** Delivery time */
  deliveryTime: string;
  /** Whether receiver signature is present */
  receiverSignaturePresent: boolean;
  /** Receiver name (if legible) */
  receiverName: string;
  /** Any additional notes or fields */
  notes: string;
}

/** Invoice data — combines BOL extraction with broker-specific fields */
export interface InvoiceData {
  /** Auto-generated or user-provided invoice number */
  invoiceNumber: string;
  /** Invoice date */
  invoiceDate: string;

  /** Broker company info */
  broker: {
    companyName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    ein: string;
    mcNumber: string;
    usDot: string;
  };

  /** Shipment data */
  shipment: {
    brokerLoadNumber: string;
    motorCarrier: string;
    mcAuthority: string;
    usDot: string;
    equipment: string;
    commodity: string;
    weight: string;
    driverName: string;
    truckTag: string;
    truckNumber: string;
  };

  /** Bill-to customer */
  billTo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };

  /** Routing details */
  routing: {
    shipperName: string;
    originSite: string;
    pickupDate: string;
    receiverName: string;
    deliverySite: string;
    deliveryDate: string;
    mcLoadNumber: string;
  };

  /** Charges */
  charges: {
    linehaul: number;
    fuelSurcharge: number;
    accessorial: number;
    totalAmountDue: number;
  };
}

/** Load status through lifecycle */
export type LoadStatus =
  | "quoted"
  | "tendered"
  | "accepted"
  | "inTransit"
  | "delivered"
  | "invoiced"
  | "paid";
