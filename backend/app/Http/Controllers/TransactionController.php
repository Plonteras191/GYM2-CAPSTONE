<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index()
    {
        $transactions = Transaction::with('member:id,first_name,last_name')->orderBy('transaction_date', 'desc')->orderBy('id', 'desc')->get();
        return response()->json($transactions);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'transaction_date' => 'required|date',
            'member_id' => 'nullable|exists:members,id',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'payment_method' => 'required|string',
            'amount' => 'required|numeric',
            'status' => 'required|string',
            'reference_number' => 'nullable|string'
        ]);

        // Auto-generate the TXN-001 format
        $latest = Transaction::latest('id')->first();
        $nextId = $latest ? $latest->id + 1 : 1;
        $validatedData['transaction_id'] = 'TXN-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

        $transaction = Transaction::create($validatedData);
        return response()->json(['message' => 'Transaction saved', 'transaction' => $transaction], 201);
    }

    public function update(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);
        $validatedData = $request->validate([
            'transaction_date' => 'required|date',
            'member_id' => 'nullable|exists:members,id',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'payment_method' => 'required|string',
            'amount' => 'required|numeric',
            'status' => 'required|string',
            'reference_number' => 'nullable|string'
        ]);

        $transaction->update($validatedData);
        return response()->json(['message' => 'Transaction updated', 'transaction' => $transaction]);
    }

    public function destroy($id)
    {
        Transaction::findOrFail($id)->delete();
        return response()->json(['message' => 'Transaction deleted']);
    }
}