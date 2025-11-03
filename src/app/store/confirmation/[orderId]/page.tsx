interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function ConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-2">Order received</h1>
      <p className="text-muted-foreground">Your order has been placed successfully.</p>
      <div className="mt-4 p-4 bg-muted border border-border rounded">
        <div className="text-sm text-muted-foreground">Order ID</div>
        <div className="font-mono text-sm">{orderId}</div>
      </div>
    </div>
  );
}


