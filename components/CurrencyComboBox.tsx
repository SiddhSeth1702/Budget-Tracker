"use client";

import * as React from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Currencies, Currency } from "@/lib/currencies";
import { useMutation, useQuery } from "@tanstack/react-query";
import SkeletonWrapper from "./SkeletonWrapper";
import { UserSettings } from "@prisma/client";
import { UpdateUserCurrency } from "@/app/wizard/_actions/user-settings";
import { toast } from "sonner";

export function CurrencyComboBox() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedOptions, setSelectedOptions] = React.useState<Currency | null>(
    null
  );
  const userSettings = useQuery<UserSettings>({
    queryKey: ["userSettings"],
    queryFn: () => fetch("/api/user-settings").then((res) => res.json()),
  });
  //   console.log(userSettings);
  // just to populate currency data if it is already pressnt in the settings
  React.useEffect(() => {
    if (!userSettings.data) return;

    const userCurrency = Currencies.find(
      (currency) => currency.value === userSettings.data.currency
    );

    if (userCurrency) {
      setSelectedOptions(userCurrency);
    }
  }, [userSettings.data]);

  const mutation = useMutation({
    mutationFn: UpdateUserCurrency,
    onSuccess: (data: UserSettings) => {
      toast.success("Currency updated successfully", {
        id: "update-currency",
      });
      setSelectedOptions(
        Currencies.find((currency) => currency.value === data.currency) || null
      );
    },
    onError: (e) => {
      toast.error("Something went wrong", {
        id: "update-currency",
      });
    },
  });

  const selectOption = React.useCallback(
    (currency: Currency | null) => {
      if (!currency) {
        toast.error("Please select a currency");
        return;
      }
      toast.loading("Updating Currency ....", {
        id: "update-currency",
      });
      mutation.mutate(currency.value); // this value will be passed  to usemutation 's mutationFn
    },
    [mutation]
  );

  if (isDesktop) {
    return (
      <SkeletonWrapper isLoading={userSettings.isFetching}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={mutation.isPending}
            >
              {selectedOptions ? (
                <>{selectedOptions.label}</>
              ) : (
                <>+ Set Currency</>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <OptionList setOpen={setOpen} selectOption={selectOption} />
          </PopoverContent>
        </Popover>
      </SkeletonWrapper>
    );
  }

  return (
    <SkeletonWrapper isLoading={userSettings.isFetching}>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
            disabled={mutation.isPending}
          >
            {selectedOptions ? (
              <>{selectedOptions.label}</>
            ) : (
              <>+ Set Currency</>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mt-4 border-t">
            <OptionList setOpen={setOpen} selectOption={selectOption} />
          </div>
        </DrawerContent>
      </Drawer>
    </SkeletonWrapper>
  );
}

function OptionList({
  setOpen,
  selectOption,
}: {
  setOpen: (open: boolean) => void;
  selectOption: (status: Currency | null) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Search currency..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {Currencies.map((currency: Currency) => (
            <CommandItem
              key={currency.value}
              value={currency.value}
              onSelect={(value) => {
                selectOption(
                  Currencies.find((priority) => priority.value === value) ||
                    null
                );
                setOpen(false);
              }}
            >
              {currency.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
