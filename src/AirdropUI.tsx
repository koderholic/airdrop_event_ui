// @ts-nocheck

import { useState } from "react";
import { Button, Input, Card, Space } from "antd";
import { useAccount } from "wagmi";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from './lib/axios';
import { NavBar } from "./components/NavBar";
import { MinusCircleOutlined } from "@ant-design/icons";
import AirdropStatusDisplay from "./components/AirdropStatusDisplay";
import useLogout from './hooks/useLogout';
const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

const AirdropSchema = z.object({
  eventName: z.string().min(1, "Airdrop name is required"),
  prizes: z
    .array(
      z.object({
        quantity: z.number({ 
          required_error: "Quantity is required",
          invalid_type_error: "Quantity must be a number",
        }).int("Quantity must be a whole number").positive("Quantity must be positive"),
        amount: z.number({
          required_error: "Amount is required",
          invalid_type_error: "Amount must be a number",
        }).int("Amount must be a whole number").positive("Amount must be positive"),
        symbol: z.string().min(1, "Token symbol is required"),
      })
    )
    .min(1, "At least one prize is required"),
  participants: z
    .array(
      z.string()
        .min(1, "Participant address is required")
        .regex(ethereumAddressRegex, "Invalid Ethereum address")
    )
    .min(1, "You must have at least one participant")
});

export default function AirdropUI() {
  const { address } = useAccount();
  const [manualAirdropId, setManualAirdropId] = useState<string>("");
  const [airdropStatus, setAirdropStatus] = useState<any>();

  const [airdropError, setAirdropError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(AirdropSchema),
    defaultValues: { eventName: "", prizes: [], participants: [""] },
  });

  const { fields: prizeFields, append: appendPrize, remove } = useFieldArray({ control, name: "prizes" });
  // const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({ control, name: "participants" });

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const { handleLogout } = useLogout();

  const [loading, setLoading] = useState<{ isLoading: boolean; message: string }>({ isLoading: false, message: '' });

  const createAirdrop = useMutation({
    mutationFn: async (data: any) => {
      setLoading({ isLoading: true, message: 'Creating airdrop event...' });

      const response = await api.post("/airdrop/create", data);
      
      return response.data;
    },
    onSuccess: (data) => {
      setFormErrors([]);
      setLoading({ isLoading: false, message: '' });
      alert(`Success: ${data.message}. Event ID: ${data.data.eventId}`);
    },
    onError: (error: any) => {
      setLoading({ isLoading: false, message: '' });
      if (error.response && error.response.status === 401) {
        handleLogout();
      } else if (error.response && error.response.status === 400) {
        if (error.response.data.errors) {
          setFormErrors(error.response.data.errors);
        } else if (error.response.data.message) {
          setFormErrors([error.response.data.message]);
        }
      } else {
        setFormErrors([]);
      }
    },
  });

  const drawOnePrize = useMutation({
    mutationFn: async () => {
      if (!manualAirdropId) {
        alert("Please enter an Airdrop ID");
        return;
      }
      setLoading({ isLoading: true, message: 'Drawing one prize...' });
      const response = await api.post(`/airdrop/${manualAirdropId}/drawOne`, {});
      return response.data;
    },
    onSuccess: (data: any) => {
      setAirdropError(null);
      setLoading({ isLoading: false, message: '' });
      alert(data.message);
    },
    onError: (error: any) => {
      setLoading({ isLoading: false, message: '' });
      if (error.response && error.response.status === 401) {
        handleLogout();
      } else if (error.response && error.response.status === 400) {
        setAirdropError(error.response.data.message || "An error occurred");
      }
    },
  });

  const drawAllPrizes = useMutation({
    mutationFn: async () => {
      if (!manualAirdropId) {
        alert("Please enter an Airdrop ID");
        return;
      }
      setLoading({ isLoading: true, message: 'Drawing all prizes...' });
      const response = await api.post(`/airdrop/${manualAirdropId}/drawAll`, {});
      return response.data;
    },
    onSuccess: (data: any) => {
      setAirdropError(null);
      setLoading({ isLoading: false, message: '' });
      alert(data.message);
    },
    onError: (error: any) => {
      setLoading({ isLoading: false, message: '' });
      if (error.response && error.response.status === 401) {
        handleLogout();
      } else if (error.response && error.response.status === 400) {
        setAirdropError(error.response.data.message || "An error occurred");
      }
    },
  });

  const checkAirdropStatus = useMutation({
    mutationFn: async () => {
      if (!manualAirdropId) {
        alert("Please enter an Airdrop ID");
        return;
      }
      setLoading({ isLoading: true, message: 'Checking airdrop status...' });
      const response = await api.get(`/airdrop/${manualAirdropId}/status`);
      setAirdropStatus(response.data.data);
      setLoading({ isLoading: false, message: '' });

    },
    onError: (error: any) => {
      setLoading({ isLoading: false, message: '' });
      if (error.response && error.response.status === 401) {
        handleLogout();
      } else if (error.response && error.response.status === 400) {
        setAirdropError(error.response.data.message || "An error occurred");
      }
    },
  });

  const rawParticipants = watch('participants').join(',');

  const handleParticipantsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const addresses = value.split(',').map(address => address.trim());
    const uniqueAddresses = Array.from(new Set(addresses)); // Remove duplicates
    setValue('participants', uniqueAddresses);
  };

  return (
    <>
      <NavBar />
      {loading.isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ color: 'white', fontSize: '24px' }}>{loading.message}</div>
        </div>
      )}
      {address ? (
        <Card title="Airdrop Management">
          {formErrors.length > 0 && (
            <div style={{ color: 'red', marginBottom: '20px' }}>
              <h4>Validation Errors:</h4>
              <ul>
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={handleSubmit((data) => createAirdrop.mutate(data))}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Input {...register("eventName")} placeholder="Airdrop Name" status={errors.eventName ? "error" : ""} onChange={(e) => {
                  setValue("eventName", e.target.value);
                }} />
                {errors.eventName && <div style={{ color: 'red' }}>{errors.eventName.message as string}</div>}
              </div>
              
              <div>
                <h3>Prizes</h3>
                {errors.prizes && <div style={{ color: 'red' }}>{errors.prizes.message as string}</div>}
                {prizeFields.map((field, index) => (
                  <Space key={field.id} direction="horizontal" style={{ width: "100%", marginBottom: "10px", display: 'flex', alignItems: 'center' }}>
                    <Input 
                      {...register(`prizes.${index}.quantity`, { valueAsNumber: true })}
                      placeholder="Quantity" 
                      type="number"
                      status={errors.prizes?.[index]?.quantity ? "error" : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setValue(`prizes.${index}.quantity`, value ? Number(value) : undefined);
                      }}
                      style={{ flex: 1, minWidth: '100px', marginRight: '10px' }}
                    />
                    {errors.prizes?.[index]?.quantity && (
                      <div style={{ color: 'red' }}>{errors.prizes[index]?.quantity?.message as string}</div>
                    )}
                    
                    <Input 
                      {...register(`prizes.${index}.amount`, { valueAsNumber: true })}
                      placeholder="Amount" 
                      type="number"
                      status={errors.prizes?.[index]?.amount ? "error" : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setValue(`prizes.${index}.amount`, value ? Number(value) : undefined);
                      }}
                      style={{ flex: 1, minWidth: '100px', marginRight: '10px' }}
                    />
                    {errors.prizes?.[index]?.amount && (
                      <div style={{ color: 'red' }}>{errors.prizes[index]?.amount?.message as string}</div>
                    )}
                    
                    <Input 
                      {...register(`prizes.${index}.symbol`)} 
                      placeholder="Symbol"
                      status={errors.prizes?.[index]?.symbol ? "error" : ""}
                      onChange={(e) => {
                        setValue(`prizes.${index}.symbol`, e.target.value);
                      }}
                      style={{ flex: 1, minWidth: '100px' }}
                    />
                    {errors.prizes?.[index]?.symbol && (
                      <div style={{ color: 'red' }}>{errors.prizes[index]?.symbol?.message as string}</div>
                    )}
                    
                    <Button 
                      type="link" 
                      onClick={() => {
                        if (prizeFields.length > 1) {
                          remove(index);
                        }
                      }}
                      style={{ marginLeft: '10px', color: 'red' }}
                      disabled={prizeFields.length <= 1}
                    >
                      <MinusCircleOutlined />
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => appendPrize({})}>Add Prize</Button>
              </div>
              
              <div>
                <h3>Participants</h3>
                <Input.TextArea 
                  placeholder="Enter Ethereum addresses (comma-separated)"
                  value={rawParticipants}
                  onChange={handleParticipantsChange}
                  status={errors.participants ? "error" : ""}
                  style={{ height: '100px' }}
                />
                {errors.participants && (
                  <div style={{ color: 'red' }}>
                    {errors.participants.message as string}
                    {errors.participants.type === 'invalid_type' && 
                      " Please enter valid Ethereum addresses separated by commas"}
                  </div>
                )}
                {Array.isArray(errors?.participants) && errors.participants.map((error, index) => {
                  if (error?.message) {
                    const address = watch('participants')[index];
                    return <div key={index} style={{ color: 'red' }}>{address}: {error.message}</div>;
                  }
                  return null;
                })}
              </div>

              <Button type="primary" htmlType="submit">Create Airdrop</Button>
            </Space>
          </form>

          
          <div style={{ marginTop: "20px" }}>
            <h3>Airdrop Actions</h3>
            <Input value={manualAirdropId} onChange={(e) => setManualAirdropId(e.target.value)} placeholder="Enter Airdrop ID" style={{ marginBottom: "10px" }} />
            {airdropError && <div style={{ color: 'red' }}>{airdropError}</div>}
            <Space>
              <Button onClick={() => drawOnePrize.mutate()}>Draw One Prize</Button>
              <Button onClick={() => drawAllPrizes.mutate()}>Draw All Prizes</Button>
              <Button onClick={() => checkAirdropStatus.mutate()}>Check Airdrop Status</Button>
            </Space>
          </div>

          {airdropStatus && <AirdropStatusDisplay airdropStatus={airdropStatus} />}
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Please connect your wallet to use the Airdrop Management system
          </div>
        </Card>
      )}
    </>
  );
}
