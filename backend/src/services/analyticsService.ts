import mongoose from 'mongoose';
import { Sale } from '../models/Sale';
import { Expense } from '../models/Expense';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';

export class AnalyticsService {
  /**
   * Get real-time business overview dashboard metrics
   */
  static async getDashboardOverview(businessId: string): Promise<any> {
    const bId = new mongoose.Types.ObjectId(businessId);
    
    // Calculate today's date range in IST (UTC offset +5:30)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Today's sales & yesterday's sales (for real comparison)
    const [todaySalesAgg, yesterdaySalesAgg] = await Promise.all([
      Sale.aggregate([
        {
          $match: {
            businessId: bId,
            isReturned: false,
            saleDate: { $gte: startOfToday }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
            count: { $sum: 1 },
            cashTotal: {
              $sum: {
                $cond: [{ $eq: ['$paymentMethod', 'CASH'] }, '$grandTotal', 0]
              }
            },
            upiTotal: {
              $sum: {
                $cond: [{ $eq: ['$paymentMethod', 'UPI'] }, '$grandTotal', 0]
              }
            },
            udhaarTotal: { $sum: '$udhaarAmount' }
          }
        }
      ]),
      Sale.aggregate([
        {
          $match: {
            businessId: bId,
            isReturned: false,
            saleDate: { $gte: startOfYesterday, $lt: startOfToday }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' }
          }
        }
      ])
    ]);
    const todaySales = todaySalesAgg[0]?.totalSales || 0;
    const todayBillsCount = todaySalesAgg[0]?.count || 0;
    const yesterdaySales = yesterdaySalesAgg[0]?.totalSales || 0;
    const salesGrowthPercent =
      yesterdaySales > 0
        ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 1000) / 10
        : null;

    // 2. Monthly sales
    const monthSalesAgg = await Sale.aggregate([
      {
        $match: {
          businessId: bId,
          isReturned: false,
          saleDate: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          monthlySales: { $sum: '$grandTotal' }
        }
      }
    ]);
    const monthlySales = monthSalesAgg[0]?.monthlySales || 0;

    // 3. Today's expenses
    const todayExpenseAgg = await Expense.aggregate([
      {
        $match: {
          businessId: bId,
          date: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);
    const todayExpenses = todayExpenseAgg[0]?.totalExpenses || 0;

    // 4. Monthly expenses
    const monthExpenseAgg = await Expense.aggregate([
      {
        $match: {
          businessId: bId,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);
    const monthlyExpenses = monthExpenseAgg[0]?.totalExpenses || 0;

    // 5. Total inventory valuation & low-stock products count
    const productStats = await Product.aggregate([
      {
        $match: {
          businessId: bId,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalValuation: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } },
          totalRetailValuation: { $sum: { $multiply: ['$currentStock', '$sellingPrice'] } },
          totalProducts: { $sum: 1 },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$currentStock', '$minStockLevel'] }, 1, 0]
            }
          }
        }
      }
    ]);
    const totalInventoryValue = Math.round((productStats[0]?.totalValuation || 0) * 100) / 100;
    const lowStockCount = productStats[0]?.lowStockCount || 0;
    const totalProducts = productStats[0]?.totalProducts || 0;

    // 6. Total customers & outstanding customer credit (Udhaar)
    const customerStats = await Customer.aggregate([
      {
        $match: { businessId: bId }
      },
      {
        $group: {
          _id: null,
          totalOutstandingCredit: { $sum: '$currentBalance' },
          totalCustomers: { $sum: 1 }
        }
      }
    ]);
    const outstandingCredit = customerStats[0]?.totalOutstandingCredit || 0;
    const totalCustomers = customerStats[0]?.totalCustomers || 0;

    // 7. Estimated Gross Profit for the month (Sales - Cost of Goods Sold)
    const cogsAgg = await Sale.aggregate([
      {
        $match: {
          businessId: bId,
          isReturned: false,
          saleDate: { $gte: startOfMonth }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.totalPrice' },
          totalCost: {
            $sum: {
              $multiply: [
                '$items.quantity',
                { $ifNull: ['$productDetails.purchasePrice', { $multiply: ['$items.unitPrice', 0.8] }] }
              ]
            }
          }
        }
      }
    ]);

    const monthRevenue = cogsAgg[0]?.totalRevenue || monthlySales;
    const monthCost = cogsAgg[0]?.totalCost || 0;
    const estimatedGrossProfit = Math.max(0, Math.round((monthRevenue - monthCost) * 100) / 100);
    const estimatedNetProfit = Math.round((estimatedGrossProfit - monthlyExpenses) * 100) / 100;

    // 8. Last 7 Days Sales Trend
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysSales = await Sale.aggregate([
      {
        $match: {
          businessId: bId,
          isReturned: false,
          saleDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          sales: { $sum: '$grandTotal' },
          bills: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 9. Payment Methods Breakdown
    const paymentBreakdown = await Sale.aggregate([
      {
        $match: {
          businessId: bId,
          isReturned: false,
          saleDate: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 10. Top 5 Selling Products this month
    const topProducts = await Sale.aggregate([
      {
        $match: {
          businessId: bId,
          isReturned: false,
          saleDate: { $gte: startOfMonth }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          unit: { $first: '$items.unit' },
          totalQuantity: { $sum: '$items.quantity' },
          totalSales: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 }
    ]);

    // 11. Recent 5 Transactions
    const recentSales = await Sale.find({ businessId: bId })
      .sort({ saleDate: -1 })
      .limit(5)
      .lean();

    return {
      todaySales,
      todayBillsCount,
      yesterdaySales,
      salesGrowthPercent,
      monthlySales,
      todayExpenses,
      monthlyExpenses,
      estimatedGrossProfit,
      estimatedNetProfit,
      totalInventoryValue,
      lowStockCount,
      totalProducts,
      outstandingCredit,
      totalCustomers,
      last7DaysSales,
      paymentBreakdown,
      topProducts,
      recentSales
    };
  }
}
