// tests/usedBookManager.test.js
const usedBookManager = require('../src/services/usedBookManager');
const productService = require('../src/services/productService');
const inventoryService = require('../src/services/inventoryService');
const redirectService = require('../src/services/redirectService');

// Mock the services
jest.mock('../src/services/productService');
jest.mock('../src/services/inventoryService');
jest.mock('../src/services/redirectService');

describe('Used Book Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should publish product when inventory is in stock', async () => {
    // Setup mocks
    productService.getProductById.mockResolvedValue({
      id: 123,
      handle: 'test-book-used-good'
    });
    productService.isUsedBookHandle.mockReturnValue(true);
    productService.getNewBookHandleFromUsed.mockReturnValue('test-book');
    inventoryService.isVariantInStock.mockResolvedValue(true);
    redirectService.findRedirectByPath.mockResolvedValue({ id: 456 });
    
    // Call the function
    const result = await usedBookManager.processInventoryChange(
      'inventory123',
      'variant123',
      123
    );
    
    // Check results
    expect(productService.setProductPublishStatus).toHaveBeenCalledWith(123, true);
    expect(redirectService.deleteRedirect).toHaveBeenCalledWith(456);
    expect(result.action).toBe('published');
  });
  
  test('should unpublish product when inventory is out of stock', async () => {
    // Setup mocks
    productService.getProductById.mockResolvedValue({
      id: 123,
      handle: 'test-book-used-good'
    });
    productService.isUsedBookHandle.mockReturnValue(true);
    productService.getNewBookHandleFromUsed.mockReturnValue('test-book');
    inventoryService.isVariantInStock.mockResolvedValue(false);
    redirectService.findRedirectByPath.mockResolvedValue(null);
    
    // Call the function
    const result = await usedBookManager.processInventoryChange(
      'inventory123',
      'variant123',
      123
    );
    
    // Check results
    expect(productService.setProductPublishStatus).toHaveBeenCalledWith(123, false);
    expect(redirectService.createRedirect).toHaveBeenCalledWith(
      'test-book-used-good',
      'test-book'
    );
    expect(result.action).toBe('unpublished');
  });
});