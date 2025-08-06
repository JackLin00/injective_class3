"use client";

import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import ExchangeDemoABI from "../contracts/ExchangeDemo.json";

const CONTRACT_ADDRESS = "0x2fEc4a9029DFB413465a55Af45242b2548257BDA"; // 替换为实际合约地址
const MARKET_ID = "0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe"; // 固定 INJ/USDT 市场 ID

export default function SpotMarket() {
  const [subaccountID, setSubaccountID] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderHash, setOrderHash] = useState("");
  const [orderType, setOrderType] = useState("1"); // 默认 BUY
  const [denom, setDenom] = useState("inj");
  const [amount, setAmount] = useState("");
  const [cid, setCid] = useState("");
  const [orders, setOrders] = useState<{ orderHash: string; cid: string; marketID: string }[]>([]);
  const [error, setError] = useState("");

  // 查询子账户余额
  const { data: balances } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExchangeDemoABI.abi,
    functionName: "subaccountBalances",
    args: [subaccountID],
  });

  // 存款
  const { writeContractAsync: deposit } = useWriteContract();

  // 创建现货限价单
  const { writeContractAsync: createOrder } = useWriteContract();

  // 取消现货订单
  const { writeContractAsync: cancelOrder } = useWriteContract();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Injective 现货市场 (INJ/USDT)</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* 存款 */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">存款</h2>
        <input
          type="text"
          placeholder="子账户 ID (如 0xYourAddress-0)"
          value={subaccountID}
          onChange={(e) => setSubaccountID(e.target.value)}
          className="border p-2 mr-2 w-64"
        />
        <input
          type="text"
          placeholder="资产类型 (如 inj)"
          value={denom}
          onChange={(e) => setDenom(e.target.value)}
          className="border p-2 mr-2 w-32"
        />
        <input
          type="text"
          placeholder="数量"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 mr-2 w-32"
        />
        <button
          onClick={() =>
            deposit({
              address: CONTRACT_ADDRESS,
              abi: ExchangeDemoABI.abi,
              functionName: "deposit",
              args: [subaccountID, denom, (ethers.utils?.parseUnits || ethers.parseUnits)(amount || "0", 18)],
            }).catch((err) => setError(`存款失败: ${err.message}`))
          }
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          存款
        </button>
      </div>

      {/* 查询余额 */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">余额</h2>
        <input
          type="text"
          placeholder="子账户 ID"
          value={subaccountID}
          onChange={(e) => setSubaccountID(e.target.value)}
          className="border p-2 mr-2 w-64"
        />
        <div className="mt-2">
          {balances && balances.length > 0 ? (
            balances.map((balance: any, index: number) => (
              <p key={index} className="text-gray-700">
                {balance.denom}: {(ethers.utils?.formatUnits || ethers.formatUnits)(balance.amount, 18)}
              </p>
            ))
          ) : (
            <p>无余额或请输入有效的子账户 ID</p>
          )}
        </div>
      </div>

      {/* 创建订单 */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">创建现货限价单 (INJ/USDT)</h2>
        <input
          type="text"
          placeholder="价格"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 mr-2 w-32"
        />
        <input
          type="text"
          placeholder="数量"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="border p-2 mr-2 w-32"
        />
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="border p-2 mr-2 w-32"
        >
          <option value="1">买入</option>
          <option value="2">卖出</option>
        </select>
        <button
          onClick={() => {
            const newCid = uuidv4();
            createOrder({
              address: CONTRACT_ADDRESS,
              abi: ExchangeDemoABI.abi,
              functionName: "createSpotLimitOrder",
              args: [{
                marketId: MARKET_ID,
                price: (ethers.utils?.parseUnits || ethers.parseUnits)(price || "0", 18),
                quantity: (ethers.utils?.parseUnits || ethers.parseUnits)(quantity || "0", 18),
                orderType: parseInt(orderType),
                subaccountId: subaccountID,
              }],
            })
              .then((data) => {
                setOrders([...orders, { orderHash: data.hash || "0xunknown", cid: newCid, marketID: MARKET_ID }]);
                setCid(newCid);
              })
              .catch((err) => setError(`创建订单失败: ${err.message}`));
          }}
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          创建订单
        </button>
      </div>

      {/* 取消订单 */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">取消现货订单 (INJ/USDT)</h2>
        <input
          type="text"
          placeholder="子账户 ID"
          value={subaccountID}
          onChange={(e) => setSubaccountID(e.target.value)}
          className="border p-2 mr-2 w-64"
        />
        <input
          type="text"
          placeholder="订单哈希"
          value={orderHash}
          onChange={(e) => setOrderHash(e.target.value)}
          className="border p-2 mr-2 w-64"
        />
        <input
          type="text"
          placeholder="客户端 ID (CID)"
          value={cid}
          onChange={(e) => setCid(e.target.value)}
          className="border p-2 mr-2 w-64"
        />
        <button
          onClick={() =>
            cancelOrder({
              address: CONTRACT_ADDRESS,
              abi: ExchangeDemoABI.abi,
              functionName: "cancelSpotOrder",
              args: [subaccountID, orderHash, MARKET_ID, cid],
            }).catch((err) => setError(`取消订单失败: ${err.message}`))
          }
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          取消订单
        </button>
      </div>

      {/* 订单列表 */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">订单列表</h2>
        {orders.length > 0 ? (
          <ul className="space-y-2">
            {orders.map((order, index) => (
              <li key={index} className="border p-2 rounded">
                <p>订单哈希: {order.orderHash}</p>
                <p>市场 ID: {order.marketID}</p>
                <p>CID: {order.cid}</p>
                <button
                  onClick={() => {
                    setOrderHash(order.orderHash);
                    setCid(order.cid);
                  }}
                  className="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600"
                >
                  选择以取消
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无订单</p>
        )}
      </div>
    </div>
  );
}
