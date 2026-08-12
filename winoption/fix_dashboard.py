path = "app/dashboard/page.tsx"
with open(path) as f:
    content = f.read()

old_type = "type Profile = {\n  balance?: number | null;\n};"
new_type = old_type + "\n\ntype SignalSubscription = {\n  id: string;\n  status?: string | null;\n  expires_at?: string | null;\n  created_at?: string | null;\n};"

if old_type not in content:
    print("ANCHOR NOT FOUND - type")
else:
    content = content.replace(old_type, new_type, 1)
    print("type OK")

old_state = "  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(\n    []\n  );"
new_state = old_state + "\n  const [subscription, setSubscription] = useState<SignalSubscription | null>(\n    null\n  );"

if old_state not in content:
    print("ANCHOR NOT FOUND - state")
else:
    content = content.replace(old_state, new_state, 1)
    print("state OK")

old_fetch = '    } catch (error) {\n      console.error("Dashboard loading error:", error);\n    } finally {\n      setLoading(false);\n      setRefreshing(false);\n    }\n  }, [router]);'
new_fetch = '      const {\n        data: subscriptionData,\n        error: subscriptionError,\n      } = await supabase\n        .from("signal_subscriptions")\n        .select("id,status,expires_at,created_at")\n        .eq("user_id", userId)\n        .order("created_at", { ascending: false })\n        .limit(1)\n        .maybeSingle();\n\n      if (subscriptionError) {\n        console.error("Signal subscription error:", subscriptionError);\n        setSubscription(null);\n      } else {\n        setSubscription(subscriptionData);\n      }\n' + old_fetch

if old_fetch not in content:
    print("ANCHOR NOT FOUND - fetch")
else:
    content = content.replace(old_fetch, new_fetch, 1)
    print("fetch OK")

with open(path, "w") as f:
    f.write(content)

print("DONE")
