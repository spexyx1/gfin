@@ .. @@
                    <span className="text-2xl apple-title text-neon-yellow text-center font-semibold">
-                      {product.priceUSDC} USDC
+                      {product.price} {product.currency}
                    </span>
+                   {product.currency !== 'GHETTO' && (
+                     <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-medium">
+                       +1.25% FEE
+                     </span>
+                   )}
                  </div>
                </div>